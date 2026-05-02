import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type ShippedPayload = {
  orderId: string;
  customerPhone: string; // serbest format
  customerName?: string | null;
  trackingNumber: string;
  carrier?: string | null;
};

type WhatsAppSettings = {
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  whatsappPhoneId: string | null;
  whatsappAccessToken: string | null;
  whatsappShippedTemplate: string | null;
  whatsappTemplateLang: string;
};

/**
 * Telefonu WhatsApp için E.164 benzeri formata çevirir (sadece rakamlar, baştaki 0'ı düşer, 90 ekler).
 * Örn: "0555 123 45 67" -> "905551234567"
 */
export function normalizePhoneToE164(raw: string, defaultCountryCode = "90"): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // başta 0 varsa ve country code içermiyorsa
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith(defaultCountryCode) && digits.length === 10) {
    digits = defaultCountryCode + digits;
  }
  // TR için toplam 12 hane bekleniyor (90 + 10)
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

/** "Merhaba {ad}" gibi hazır mesajı kullanıcıya özelleştir. */
export function buildWaMeUrl(rawPhone: string, text?: string | null): string | null {
  const phone = normalizePhoneToE164(rawPhone);
  if (!phone) return null;
  const qs = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${qs}`;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getSettings(): Promise<WhatsAppSettings | null> {
    const s = await this.prisma.siteSettings.findFirst();
    if (!s) return null;
    return {
      whatsappEnabled: s.whatsappEnabled,
      whatsappNumber: s.whatsappNumber,
      whatsappPhoneId: s.whatsappPhoneId,
      whatsappAccessToken: s.whatsappAccessToken,
      whatsappShippedTemplate: s.whatsappShippedTemplate,
      whatsappTemplateLang: s.whatsappTemplateLang || "tr",
    };
  }

  /**
   * Kargoya verildi bildirimini WhatsApp Cloud API üzerinden gönderir.
   * API yapılandırılmamışsa veya hata olursa bir wa.me fallback linki loglar ve döner.
   */
  async notifyShipped(payload: ShippedPayload): Promise<{
    sent: boolean;
    provider: "cloud_api" | "fallback" | "disabled";
    fallbackUrl?: string;
    error?: string;
  }> {
    const settings = await this.getSettings();
    if (!settings || !settings.whatsappEnabled) {
      this.logger.log(
        `[whatsapp:disabled] sipariş=${payload.orderId} takip=${payload.trackingNumber}`,
      );
      return { sent: false, provider: "disabled" };
    }

    const to = normalizePhoneToE164(payload.customerPhone);
    if (!to) {
      this.logger.warn(
        `[whatsapp] sipariş=${payload.orderId} için geçersiz müşteri telefonu "${payload.customerPhone}"`,
      );
      return { sent: false, provider: "disabled", error: "invalid-phone" };
    }

    const greetingName = payload.customerName?.trim() || "Değerli müşterimiz";
    const defaultText = `Merhaba ${greetingName}, siparişiniz (#${payload.orderId.slice(
      0,
      8,
    )}) kargoya verildi. Takip numaranız: ${payload.trackingNumber}${
      payload.carrier ? ` (${payload.carrier})` : ""
    }`;

    const fallbackUrl = buildWaMeUrl(to, defaultText) ?? undefined;

    if (
      !settings.whatsappPhoneId ||
      !settings.whatsappAccessToken ||
      !settings.whatsappShippedTemplate
    ) {
      this.logger.log(
        `[whatsapp:fallback] Cloud API ayarlı değil, manuel link: ${fallbackUrl ?? "—"}`,
      );
      return { sent: false, provider: "fallback", fallbackUrl };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${settings.whatsappPhoneId}/messages`;
      const body = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: settings.whatsappShippedTemplate,
          language: { code: settings.whatsappTemplateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: greetingName },
                { type: "text", text: payload.orderId.slice(0, 8) },
                { type: "text", text: payload.trackingNumber },
                ...(payload.carrier
                  ? [{ type: "text", text: payload.carrier }]
                  : []),
              ],
            },
          ],
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn(
          `[whatsapp] Cloud API hatası (${res.status}): ${errText.slice(0, 300)}`,
        );
        return {
          sent: false,
          provider: "fallback",
          fallbackUrl,
          error: `cloud-api-${res.status}`,
        };
      }

      this.logger.log(
        `[whatsapp:sent] sipariş=${payload.orderId} -> ${to} takip=${payload.trackingNumber}`,
      );
      return { sent: true, provider: "cloud_api" };
    } catch (e) {
      this.logger.warn(
        `[whatsapp] istek başarısız: ${e instanceof Error ? e.message : e}`,
      );
      return {
        sent: false,
        provider: "fallback",
        fallbackUrl,
        error: "network",
      };
    }
  }
}
