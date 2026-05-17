import { Injectable, Logger } from "@nestjs/common";
import { buildWaMeUrl, normalizePhoneToE164 } from "../common/phone.util";
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
