import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

type Transport = nodemailer.Transporter | null;
type SmtpEncryption = "tls" | "ssl" | "none";

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transport = null;
  private fromAddress = "";
  private adminEmails: string[] = [];
  private smtpConfigured = false;
  private smtpEnabledInDb = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.reloadFromSettings();
  }

  /** SiteSettings veya .env değişince çağrılır. */
  async reloadFromSettings(): Promise<void> {
    const s = await this.prisma.siteSettings.findFirst();
    const host = s?.smtpHost?.trim() || process.env.SMTP_HOST?.trim() || "";
    const enabled = Boolean(s?.smtpEnabled) || Boolean(process.env.SMTP_HOST?.trim());
    this.smtpEnabledInDb = Boolean(s?.smtpEnabled);

    if (!host || !enabled) {
      this.transporter = null;
      this.smtpConfigured = false;
      if (!host) {
        this.logger.log("SMTP yapılandırılmadı — e-postalar stub olarak loglanacak.");
      }
      return;
    }

    const port = s?.smtpPort ?? Number(process.env.SMTP_PORT ?? 587);
    const enc = (s?.smtpEncryption?.trim() || process.env.SMTP_ENCRYPTION || "tls").toLowerCase() as SmtpEncryption;
    const user = s?.smtpUsername?.trim() || process.env.SMTP_USER?.trim() || "";
    const pass = s?.smtpPassword?.trim() || process.env.SMTP_PASS?.trim() || "";
    const fromEmail = s?.smtpFromEmail?.trim() || process.env.SMTP_FROM_EMAIL?.trim() || user;
    const fromName = s?.smtpFromName?.trim() || process.env.SMTP_FROM_NAME?.trim() || s?.siteName || process.env.SITE_NAME || "Mağaza";

    this.fromAddress = fromEmail
      ? fromName
        ? `${fromName} <${fromEmail}>`
        : fromEmail
      : process.env.SMTP_FROM ?? "no-reply@example.com";

    this.adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const secure = enc === "ssl" || port === 465;
    const requireTLS = enc === "tls";

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: requireTLS && !secure,
        auth: user && pass ? { user, pass } : undefined,
      });
      await this.transporter.verify();
      this.smtpConfigured = true;
      this.logger.log(`SMTP hazır (${host}:${port}, ${enc}).`);
    } catch (e) {
      this.transporter = null;
      this.smtpConfigured = false;
      this.logger.warn(
        `SMTP bağlantısı kurulamadı: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  isSmtpReady(): boolean {
    return Boolean(this.transporter);
  }

  private async send(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.transporter) {
      this.logger.log(`[email:stub] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"`);
      return { ok: false, error: "SMTP yapılandırılmamış" };
    }
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: Array.isArray(to) ? to.join(",") : to,
        subject,
        html,
        text: text ?? html.replace(/<[^>]+>/g, ""),
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`E-posta gönderilemedi (${subject}): ${msg}`);
      return { ok: false, error: msg };
    }
  }

  async sendTestMail(to: string): Promise<{ ok: true } | { ok: false; error: string }> {
    return this.send(
      to,
      "SMTP test mesajı",
      "<p>Bu bir test e-postasıdır. SMTP ayarlarınız çalışıyor.</p>",
    );
  }

  async sendMarketingMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.transporter) {
      this.logger.log(`[email:stub] marketing to=${to} subject="${subject}"`);
      return { ok: true };
    }
    return this.send(to, subject, html);
  }

  async campaignEmail(payload: {
    to: string;
    title: string;
    bodyHtml: string;
    couponCode?: string | null;
    ctaLink?: string | null;
    couponExpiresAt?: Date | null;
    channel: string;
    whatsappDigits?: string | null;
  }): Promise<{ ok: true } | { ok: false; error?: string }> {
    let extras = "";
    if (payload.couponCode) {
      extras += `<p style="font-size:17px">Kupon kodunuz: <strong>${payload.couponCode}</strong></p>`;
    }
    if (payload.couponExpiresAt) {
      extras += `<p>Son kullanım: <strong>${payload.couponExpiresAt.toLocaleDateString("tr-TR")}</strong></p>`;
    }
    if (payload.ctaLink) {
      extras += `<p><a href="${payload.ctaLink}">Devam et</a></p>`;
    }
    if (payload.channel === "WHATSAPP_LINK" && payload.whatsappDigits) {
      extras += `<p><a href="https://wa.me/${payload.whatsappDigits}">WhatsApp ile yazın</a></p>`;
    }
    const html = `<h2>${payload.title}</h2><div>${payload.bodyHtml}</div>${extras}`;
    return this.sendMarketingMail(payload.to, payload.title, html);
  }

  async couponEmail(payload: {
    to: string;
    subject: string;
    introHtml: string;
    code: string;
    expiresAt?: Date | null;
    ctaHref?: string | null;
  }): Promise<{ ok: true } | { ok: false; error?: string }> {
    let extras = `<p style="font-size:17px">Kod: <strong>${payload.code}</strong></p>`;
    if (payload.expiresAt) {
      extras += `<p>Geçerlilik: ${payload.expiresAt.toLocaleDateString("tr-TR")}</p>`;
    }
    if (payload.ctaHref) {
      extras += `<p><a href="${payload.ctaHref}">Mağazaya git</a></p>`;
    }
    const html = `<h2>${payload.subject}</h2><div>${payload.introHtml}</div>${extras}`;
    return this.sendMarketingMail(payload.to, payload.subject, html);
  }

  async birthdayCouponEmail(payload: {
    to: string;
    name?: string | null;
    code: string;
    expiresAt?: Date | null;
    storeName?: string;
  }): Promise<{ ok: true } | { ok: false; error?: string }> {
    const who = payload.name?.trim() ? ` ${payload.name.trim()}` : "";
    const subject = `${payload.storeName ?? "Mağaza"} · Doğum gününüz kutlu olsun`;
    const intro = `<p>Merhaba${who},</p><p>Özel gününüz için bir indirim kodu hazırladık.</p>`;
    let extras = `<p style="font-size:17px">Kod: <strong>${payload.code}</strong></p>`;
    if (payload.expiresAt) {
      extras += `<p>Son kullanım: ${payload.expiresAt.toLocaleDateString("tr-TR")}</p>`;
    }
    const html = `<h2>İyi ki doğdunuz</h2>${intro}${extras}`;
    return this.sendMarketingMail(payload.to, subject, html);
  }

  async abandonedCartEmail(payload: {
    to: string;
    lines: Array<{ title: string; quantity: number; slug?: string }>;
    totalCents: number;
    couponCode?: string;
    ctaHref: string;
    storeBaseUrl?: string;
  }): Promise<{ ok: true } | { ok: false; error?: string }> {
    const subject = "Sepetinizde ürünler sizi bekliyor";
    const origin = (payload.storeBaseUrl ?? payload.ctaHref).replace(/\/$/, "");
    const rows = payload.lines
      .slice(0, 12)
      .map(
        (l) =>
          `<li>${l.quantity}× ${l.title}${
            l.slug ? ` — <a href="${origin}/shop/${l.slug}">ürüne git</a>` : ""
          }</li>`,
      )
      .join("");
    const tot = (payload.totalCents / 100).toFixed(2);
    let couponBlock = "";
    if (payload.couponCode) {
      couponBlock = `<p>Özel kodunuz: <strong>${payload.couponCode}</strong></p>`;
    }
    const html = `
      <h2>Sepetinize göz atın</h2>
      <p>Eklediğiniz ürünler hâlâ sizin için ayrıldı. Sepet tutarı (yaklaşık): <strong>${tot} TL</strong></p>
      <ul>${rows}</ul>
      ${couponBlock}
      <p><a href="${payload.ctaHref}">Sepete dön</a></p>`;
    return this.sendMarketingMail(payload.to, subject, html);
  }

  orderCreated(payload: {
    orderId: string;
    guestEmail?: string | null;
    totalCents: number;
    currency: string;
  }) {
    const tot = (payload.totalCents / 100).toFixed(2);
    const subject = `Siparişiniz alındı · #${payload.orderId.slice(0, 8)}`;
    const html = `
      <h2>Siparişiniz alındı</h2>
      <p>Sipariş numaranız: <strong>${payload.orderId}</strong></p>
      <p>Toplam: <strong>${tot} ${payload.currency}</strong></p>
      <p>Siparişinizin durumu güncellendikçe sizi bilgilendireceğiz.</p>`;
    const to: string[] = [];
    if (payload.guestEmail) to.push(payload.guestEmail);
    if (to.length) void this.send(to, subject, html);
    if (this.adminEmails.length) {
      void this.send(
        this.adminEmails,
        `Yeni sipariş · ${tot} ${payload.currency}`,
        `<p>Yeni sipariş <strong>${payload.orderId}</strong> — ${tot} ${payload.currency}${
          payload.guestEmail ? ` · ${payload.guestEmail}` : ""
        }</p>`,
      );
    }
    this.logger.log(
      `sipariş=${payload.orderId} tutar=${payload.totalCents} ${payload.currency} alıcı=${payload.guestEmail ?? "—"}`,
    );
  }

  async passwordReset(payload: {
    email: string;
    resetUrl: string;
  }): Promise<{ ok: true } | { ok: false; error: string; userFacing: string }> {
    const subject = "Şifre sıfırlama talebi";
    const html = `
      <h2>Şifre sıfırlama</h2>
      <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat içinde geçerli):</p>
      <p><a href="${payload.resetUrl}">${payload.resetUrl}</a></p>
      <p>Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>`;

    if (!this.transporter) {
      this.logger.log(`[email:stub] şifre sıfırlama -> ${payload.email} url=${payload.resetUrl}`);
      if (this.smtpEnabledInDb) {
        return {
          ok: false,
          error: "SMTP not ready",
          userFacing:
            "E-posta sunucusu şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin veya mağaza ile iletişime geçin.",
        };
      }
      return { ok: true };
    }

    const r = await this.send(payload.email, subject, html);
    if (!r.ok) {
      return {
        ok: false,
        error: r.error,
        userFacing:
          "Sıfırlama bağlantısı şu an gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin.",
      };
    }
    this.logger.log(`şifre sıfırlama gönderildi -> ${payload.email}`);
    return { ok: true };
  }

  async contactFormMail(payload: {
    to: string;
    name: string;
    email: string;
    message: string;
  }): Promise<{ ok: true } | { ok: false; error: string; userFacing: string }> {
    const subject = `İletişim formu · ${payload.name}`;
    const html = `
      <h2>Yeni iletişim mesajı</h2>
      <p><strong>Ad:</strong> ${payload.name}</p>
      <p><strong>E-posta:</strong> ${payload.email}</p>
      <p><strong>Mesaj:</strong></p>
      <p>${payload.message.replace(/\n/g, "<br>")}</p>`;
    if (!this.transporter) {
      this.logger.log(`[email:stub] contact from=${payload.email}`);
      return {
        ok: false,
        error: "SMTP not configured",
        userFacing: "Mesajınız şu an iletilemiyor. Lütfen telefon veya e-posta ile doğrudan bize ulaşın.",
      };
    }
    const r = await this.send(payload.to, subject, html, undefined);
    if (!r.ok) {
      return {
        ok: false,
        error: r.error,
        userFacing: "Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin.",
      };
    }
    return { ok: true };
  }

  stockAlert(payload: { productName: string; stock: number; outOfStock: boolean }) {
    if (!this.adminEmails.length) {
      this.logger.log(
        `[email:stub] stok uyarısı -> "${payload.productName}" kalan=${payload.stock}${
          payload.outOfStock ? " (TÜKENDI)" : ""
        }`,
      );
      return;
    }
    const subject = payload.outOfStock
      ? `Stok tükendi · ${payload.productName}`
      : `Stok kritik · ${payload.productName}`;
    const html = `
      <h2>${subject}</h2>
      <p>Ürün: <strong>${payload.productName}</strong></p>
      <p>Kalan stok: <strong>${payload.stock}</strong></p>`;
    void this.send(this.adminEmails, subject, html);
  }

  returnRequested(payload: { orderId: string; requesterEmail?: string | null; reason: string }) {
    const subject = `Yeni iade talebi · #${payload.orderId.slice(0, 8)}`;
    const html = `
      <h2>Yeni iade talebi</h2>
      <p>Sipariş: <strong>${payload.orderId}</strong></p>
      <p>Sebep: ${payload.reason}</p>
      ${payload.requesterEmail ? `<p>Talep eden: ${payload.requesterEmail}</p>` : ""}`;
    if (this.adminEmails.length) void this.send(this.adminEmails, subject, html);
    this.logger.log(`iade talebi -> ${payload.orderId}`);
  }

  returnDecided(payload: {
    to: string;
    orderId: string;
    status: "APPROVED" | "REJECTED" | "COMPLETED";
    note?: string | null;
  }) {
    const label =
      payload.status === "APPROVED"
        ? "onaylandı"
        : payload.status === "REJECTED"
          ? "reddedildi"
          : "tamamlandı";
    const subject = `İade talebiniz ${label} · #${payload.orderId.slice(0, 8)}`;
    const html = `
      <h2>İade talebiniz ${label}</h2>
      <p>Sipariş: <strong>${payload.orderId}</strong></p>
      ${payload.note ? `<p>Not: ${payload.note}</p>` : ""}`;
    void this.send(payload.to, subject, html);
  }
}
