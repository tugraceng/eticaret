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
