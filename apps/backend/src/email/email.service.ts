import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as nodemailer from "nodemailer";

type Transport = nodemailer.Transporter | null;

/**
 * SMTP yapılandırıldıysa (SMTP_HOST tanımlı) gerçek e-posta gönderir,
 * aksi halde geliştirici logunda stub olarak çalışır.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transport = null;
  private fromAddress = "";
  private adminEmails: string[] = [];

  async onModuleInit() {
    const host = process.env.SMTP_HOST;
    if (!host) {
      this.logger.log("SMTP_HOST tanımlı değil — e-postalar stub olarak loglanacak.");
      return;
    }
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = (process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.fromAddress =
      process.env.SMTP_FROM ??
      (user ? `${process.env.SITE_NAME ?? "Mağaza"} <${user}>` : "no-reply@example.com");
    this.adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });
      await this.transporter.verify();
      this.logger.log(`SMTP hazır (${host}:${port}${secure ? ", tls" : ""}).`);
    } catch (e) {
      this.transporter = null;
      this.logger.warn(
        `SMTP bağlantısı kurulamadı, stub moduna düşüldü: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  private async send(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[email:stub] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: Array.isArray(to) ? to.join(",") : to,
        subject,
        html,
        text: text ?? html.replace(/<[^>]+>/g, ""),
      });
    } catch (e) {
      this.logger.warn(
        `E-posta gönderilemedi (${subject}): ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /** Pazarlama toplu gönderiminde alıcı bazlı sonuç için (stub modunda her zaman başarılı). */
  async sendMarketingMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.transporter) {
      this.logger.log(`[email:stub] marketing to=${to} subject="${subject}"`);
      return { ok: true };
    }
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: html.replace(/<[^>]+>/g, ""),
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
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

  passwordReset(payload: { email: string; resetUrl: string }) {
    const subject = "Şifre sıfırlama talebi";
    const html = `
      <h2>Şifre sıfırlama</h2>
      <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat içinde geçerli):</p>
      <p><a href="${payload.resetUrl}">${payload.resetUrl}</a></p>
      <p>Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>`;
    void this.send(payload.email, subject, html);
    this.logger.log(`şifre sıfırlama -> ${payload.email}`);
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
