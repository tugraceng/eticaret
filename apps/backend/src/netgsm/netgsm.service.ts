import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { normalizePhoneTrMobile10 } from "../common/phone.util";

export type NetgsmShippedPayload = {
  orderId: string;
  customerPhone: string;
  customerName?: string | null;
  trackingNumber: string;
  carrier?: string | null;
};

export type NetgsmSmsLogContext = {
  purpose: string;
  orderId?: string | null;
  campaignId?: string | null;
};

type NetgsmSettings = {
  netgsmEnabled: boolean;
  netgsmUsercode: string | null;
  netgsmPassword: string | null;
  netgsmMsgHeader: string | null;
  netgsmSmsFilter: string;
  netgsmShippedMessageTemplate: string | null;
};

const NETGSM_SEND_GET = "https://api.netgsm.com.tr/sms/send/get";

const DEFAULT_SHIPPED_TEMPLATE =
  "Merhaba {ad}, siparisiniz (#{siparis}) kargoya verildi. Takip no: {takip}{tasiyici}";

@Injectable()
export class NetgsmService {
  private readonly logger = new Logger(NetgsmService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getSettings(): Promise<NetgsmSettings | null> {
    const s = await this.prisma.siteSettings.findFirst();
    if (!s) return null;
    return {
      netgsmEnabled: s.netgsmEnabled,
      netgsmUsercode: s.netgsmUsercode,
      netgsmPassword: s.netgsmPassword,
      netgsmMsgHeader: s.netgsmMsgHeader,
      netgsmSmsFilter: (s.netgsmSmsFilter ?? "0").trim() || "0",
      netgsmShippedMessageTemplate: s.netgsmShippedMessageTemplate,
    };
  }

  async listLogs(opts?: { limit?: number; offset?: number; purpose?: string }) {
    const limit = Math.min(Math.max(Number(opts?.limit) || 50, 1), 200);
    const offset = Math.max(Number(opts?.offset) || 0, 0);
    const purpose = opts?.purpose?.trim();
    const where = purpose ? { purpose } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.smsOutboundLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.smsOutboundLog.count({ where }),
    ]);
    return { items, total, limit, offset };
  }

  /**
   * Tek adet SMS — kampanya veya scriptler için.
   * `filter`: bilgilendirme "0"; ticari İYS için Netgsm dokümanına göre "11" / "12".
   */
  async sendSms(opts: {
    toRaw: string;
    message: string;
    /** Varsayılan: ayarlardaki netgsmSmsFilter (kampanya). Kargo için genelde "0" kullanın. */
    filter?: string;
    /** Doluysa her deneme veritabanına yazılır. */
    log?: NetgsmSmsLogContext;
  }): Promise<{ ok: boolean; code?: string; detail?: string }> {
    const settings = await this.getSettings();
    const rawMsg = (opts.message ?? "").trim();
    const gsm10 = normalizePhoneTrMobile10(opts.toRaw);
    const filterForApi =
      opts.filter !== undefined
        ? opts.filter.trim() || "0"
        : (settings?.netgsmSmsFilter ?? "0").trim() || "0";

    let ok = false;
    let providerCode: string | undefined;
    let providerDetail: string | undefined;

    try {
      if (!settings?.netgsmEnabled) {
        providerCode = "disabled";
        providerDetail = "NetGSM kapalı";
      } else if (!gsm10) {
        providerCode = "phone";
        providerDetail = "Geçersiz telefon";
      } else if (!rawMsg) {
        providerCode = "empty";
        providerDetail = "Mesaj boş";
      } else {
        const uc = settings.netgsmUsercode?.trim();
        const pw = settings.netgsmPassword?.trim();
        const header = settings.netgsmMsgHeader?.trim();
        if (!uc || !pw || !header) {
          providerCode = "config";
          providerDetail = "NetGSM kullanıcı/başlık eksik";
        } else {
          const params = new URLSearchParams({
            usercode: uc,
            password: pw,
            gsmno: gsm10,
            message: rawMsg,
            msgheader: header,
            filter: filterForApi,
            encoding: "TR",
          });
          const res = await fetch(`${NETGSM_SEND_GET}?${params.toString()}`, {
            method: "GET",
            headers: { Accept: "text/plain" },
          });
          const text = (await res.text()).trim();
          const code = text.split(/\s+/)[0] ?? text;
          providerCode = code;
          providerDetail = text;
          ok = code === "00";
          if (ok) this.logger.log(`[netgsm:sent] gsm=…${gsm10.slice(-4)} len=${rawMsg.length}`);
          else this.logger.warn(`[netgsm] hata kodu=${code} yanıt=${text.slice(0, 200)}`);
        }
      }
    } catch (e) {
      providerCode = "network";
      providerDetail = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[netgsm] istek hatası: ${providerDetail}`);
    }

    if (opts.log) {
      try {
        await this.prisma.smsOutboundLog.create({
          data: {
            purpose: opts.log.purpose,
            toMasked: gsm10 ? `******${gsm10.slice(-4)}` : "****",
            messagePreview: rawMsg.slice(0, 500),
            filterUsed: filterForApi,
            ok,
            providerCode: providerCode ?? null,
            providerDetail: providerDetail ? providerDetail.slice(0, 8000) : null,
            orderId: opts.log.orderId ?? null,
            campaignId: opts.log.campaignId ?? null,
          },
        });
      } catch (logErr) {
        this.logger.warn(
          `[netgsm] günlük yazılamadı: ${logErr instanceof Error ? logErr.message : logErr}`,
        );
      }
    }

    return { ok, code: providerCode, detail: providerDetail };
  }

  /** Sipariş kargoya verildi — ticari filtresi kullanılmaz (bilgilendirme). */
  async notifyShipped(payload: NetgsmShippedPayload): Promise<{ ok: boolean; error?: string }> {
    const settings = await this.getSettings();
    const tpl =
      settings?.netgsmShippedMessageTemplate?.trim() || DEFAULT_SHIPPED_TEMPLATE;
    const ad = payload.customerName?.trim() || "Musterimiz";
    const siparis = payload.orderId.slice(0, 8);
    const tasiyici = payload.carrier?.trim() ? ` (${payload.carrier.trim()})` : "";
    const message = tpl
      .replace(/\{ad\}/g, ad)
      .replace(/\{siparis\}/g, siparis)
      .replace(/\{takip\}/g, payload.trackingNumber.trim())
      .replace(/\{tasiyici\}/g, tasiyici);

    const r = await this.sendSms({
      toRaw: payload.customerPhone,
      message,
      filter: "0",
      log: { purpose: "ORDER_SHIPPED", orderId: payload.orderId },
    });
    return r.ok ? { ok: true } : { ok: false, error: r.detail ?? r.code };
  }
}
