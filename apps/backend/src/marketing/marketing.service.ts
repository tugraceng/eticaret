import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DiscountKind } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { DiscountsService } from "../discounts/discounts.service";
import type { CampaignAudience, CreateCampaignDto } from "./dto/create-campaign.dto";
import type { GuestAbandonDto } from "./dto/guest-abandon.dto";

const BATCH = 15;
const BATCH_PAUSE_MS = 120;

function marketingEmailGapMs(): number {
  const n = Number(process.env.MARKETING_EMAIL_GAP_MS);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 60_000) : 0;
}

/** Kampanya alıcısı: üye userId dolu; misafir sepeti için null */
export type AudienceRecipient = { userId: string | null; email: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function birthdayWithinDays(birthDate: Date, days: number): boolean {
  const now = new Date();
  const y = now.getFullYear();
  const next = new Date(y, birthDate.getMonth(), birthDate.getDate(), 0, 0, 0, 0);
  if (next.getTime() < now.getTime()) {
    next.setFullYear(y + 1);
  }
  const diffDays = (next.getTime() - now.getTime()) / 86400000;
  return diffDays >= 0 && diffDays <= days;
}

@Injectable()
export class MarketingService {
  private readonly log = new Logger(MarketingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly discounts: DiscountsService,
  ) {}

  private marketingBaseWhere() {
    return {
      role: "CUSTOMER" as const,
      marketingOptIn: true,
      kvkkAcceptedAt: { not: null },
    };
  }

  async resolveRecipients(audience: CampaignAudience): Promise<AudienceRecipient[]> {
    const base = this.marketingBaseWhere();
    switch (audience) {
      case "ALL_OPT_IN": {
        const rows = await this.prisma.user.findMany({
          where: base,
          select: { id: true, email: true },
        });
        return rows.map((r) => ({ userId: r.id, email: r.email }));
      }
      case "LAST_30_SHOPPERS": {
        const since = new Date(Date.now() - 30 * 86400000);
        const orders = await this.prisma.order.findMany({
          where: {
            buyerUserId: { not: null },
            status: { not: "CANCELLED" },
            createdAt: { gte: since },
          },
          select: { buyerUserId: true },
          distinct: ["buyerUserId"],
        });
        const ids = orders.map((o) => o.buyerUserId!).filter(Boolean);
        if (!ids.length) return [];
        const rows = await this.prisma.user.findMany({
          where: { ...base, id: { in: ids } },
          select: { id: true, email: true },
        });
        return rows.map((r) => ({ userId: r.id, email: r.email }));
      }
      case "NEVER_ORDERED": {
        const ordered = await this.prisma.order.findMany({
          where: { buyerUserId: { not: null }, status: { not: "CANCELLED" } },
          select: { buyerUserId: true },
          distinct: ["buyerUserId"],
        });
        const orderedIds = ordered.map((o) => o.buyerUserId!).filter(Boolean);
        const rows = await this.prisma.user.findMany({
          where: orderedIds.length ? { ...base, id: { notIn: orderedIds } } : base,
          select: { id: true, email: true },
        });
        return rows.map((r) => ({ userId: r.id, email: r.email }));
      }
      case "ABANDONED": {
        const staleBefore = new Date(Date.now() - 60 * 60 * 1000);
        const rows = await this.prisma.abandonedCart.findMany({
          where: {
            itemCount: { gt: 0 },
            lastActivityAt: { lte: staleBefore },
          },
          include: {
            user: { select: { id: true, email: true, marketingOptIn: true, kvkkAcceptedAt: true } },
          },
        });
        const userList: AudienceRecipient[] = rows
          .filter((r) => r.user.marketingOptIn && r.user.kvkkAcceptedAt)
          .map((r) => ({ userId: r.user.id, email: r.user.email }));
        const seen = new Set(userList.map((u) => u.email.toLowerCase()));
        const guests = await this.prisma.guestAbandonedCart.findMany({
          where: {
            itemCount: { gt: 0 },
            lastActivityAt: { lte: staleBefore },
            marketingOptIn: true,
          },
          select: { email: true },
        });
        const out = [...userList];
        for (const g of guests) {
          const em = g.email.toLowerCase();
          if (!seen.has(em)) {
            seen.add(em);
            out.push({ userId: null, email: g.email });
          }
        }
        return out;
      }
      case "BIRTHDAY_7D": {
        const users = await this.prisma.user.findMany({
          where: { ...base, birthDate: { not: null } },
          select: { id: true, email: true, birthDate: true },
        });
        return users
          .filter((u) => u.birthDate && birthdayWithinDays(u.birthDate, 7))
          .map((u) => ({ userId: u.id, email: u.email }));
      }
      default:
        return [];
    }
  }

  async previewAudience(audience: CampaignAudience) {
    const list = await this.resolveRecipients(audience);
    const dedup = new Map<string, AudienceRecipient>();
    for (const u of list) {
      if (u.email && !dedup.has(u.email.toLowerCase())) {
        dedup.set(u.email.toLowerCase(), u);
      }
    }
    return { count: dedup.size };
  }

  async upsertGuestAbandonedCart(dto: GuestAbandonDto) {
    const email = dto.email.trim().toLowerCase();
    if (!email.includes("@")) throw new BadRequestException("Geçersiz e-posta.");

    const map = new Map<
      string,
      {
        productId: string;
        productVariantId: string | null;
        lineKey: string;
        quantity: number;
        title: string;
        priceCents: number;
        slug?: string;
      }
    >();
    for (const line of dto.lines) {
      const productId = line.productId?.trim();
      if (!productId) continue;
      const qty = Math.max(1, Number(line.quantity) || 1);
      const productVariantId = line.productVariantId?.trim() || null;
      const lineKey =
        (line.lineKey?.trim() ||
          (productVariantId ? `v:${productVariantId}` : `p:${productId}`)) as string;
      const prev = map.get(lineKey);
      const title = line.title?.trim() || "Ürün";
      const priceCents = typeof line.priceCents === "number" ? Math.max(0, line.priceCents) : 0;
      if (prev) prev.quantity += qty;
      else {
        map.set(lineKey, {
          productId,
          productVariantId,
          lineKey,
          quantity: qty,
          title,
          priceCents,
          slug: line.slug?.trim() || undefined,
        });
      }
    }
    const merged = Array.from(map.values());
    if (!merged.length) {
      await this.prisma.guestAbandonedCart.deleteMany({ where: { email } });
      return { ok: true, deleted: true };
    }
    const totalCents = merged.reduce((s, l) => s + l.priceCents * l.quantity, 0);
    const itemCount = merged.reduce((s, l) => s + l.quantity, 0);
    const snapshot = merged.map((l) => ({
      title: l.title,
      quantity: l.quantity,
      slug: l.slug,
      lineKey: l.lineKey,
      priceCents: l.priceCents,
    }));
    await this.prisma.guestAbandonedCart.upsert({
      where: { email },
      create: {
        email,
        marketingOptIn: dto.marketingOptIn,
        snapshot,
        totalCents,
        itemCount,
        lastActivityAt: new Date(),
      },
      update: {
        marketingOptIn: dto.marketingOptIn,
        snapshot,
        totalCents,
        itemCount,
        lastActivityAt: new Date(),
      },
    });
    return { ok: true };
  }

  async listGuestAbandonedCarts() {
    return this.prisma.guestAbandonedCart.findMany({
      orderBy: { lastActivityAt: "desc" },
      take: 200,
    });
  }

  async remindGuestAbandonedCart(id: string, discountCode?: string) {
    const row = await this.prisma.guestAbandonedCart.findUnique({ where: { id } });
    if (!row || row.itemCount <= 0) throw new NotFoundException("Misafir sepet kaydı yok.");
    if (!row.marketingOptIn) {
      throw new BadRequestException("Bu adrese kampanya izni verilmemiş; hatırlatma gönderilemez.");
    }
    let coupon: string | undefined;
    if (discountCode?.trim()) {
      const codeNorm = discountCode.trim().toUpperCase();
      const found = await this.prisma.discountCode.findFirst({
        where: { code: codeNorm, isActive: true },
      });
      if (!found) throw new BadRequestException("Kupon kodu bulunamadı.");
      coupon = found.code;
    }
    const lines = Array.isArray(row.snapshot)
      ? (row.snapshot as Array<{ title?: string; quantity?: number; slug?: string }>)
      : [];
    const base = (process.env.PUBLIC_STORE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const r = await this.email.abandonedCartEmail({
      to: row.email,
      lines: lines.map((l) => ({
        title: String(l.title ?? "Ürün"),
        quantity: Math.max(1, Number(l.quantity) || 1),
        slug: l.slug,
      })),
      totalCents: row.totalCents,
      couponCode: coupon,
      ctaHref: `${base}/cart`,
      storeBaseUrl: base,
    });
    if (!r.ok) throw new BadRequestException(r.error ?? "E-posta gönderilemedi.");
    return { ok: true };
  }

  /**
   * Site ayarı açıksa: önümüzdeki 7 gün içinde doğum günü olan izinli müşterilere
   * yılda bir kez %10 kupon oluşturup e-posta gönderir.
   * Harici cron için uygun — Nest Schedule eklendiğinde buraya bağlanabilir.
   */
  async runBirthdayAutomation() {
    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings?.birthdayCouponAutomationEnabled) {
      return { skipped: true, message: "Doğum günü otomasyonu kapalı (mağaza ayarları)." };
    }
    const siteName = settings.siteName ?? "Mağaza";
    const year = new Date().getFullYear();
    const base = this.marketingBaseWhere();
    const users = await this.prisma.user.findMany({
      where: { ...base, birthDate: { not: null } },
      select: { id: true, email: true, name: true, birthDate: true },
    });
    const due = users.filter((u) => u.birthDate && birthdayWithinDays(u.birthDate, 7));
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();

    for (const u of due) {
      const existing = await this.prisma.birthdayCouponLog.findUnique({
        where: { userId_year: { userId: u.id, year } },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      let code = "";
      let discountId: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        code = `DG${year}${randomBytes(3).toString("hex").toUpperCase()}`;
        try {
          const d = await this.discounts.create({
            code,
            kind: DiscountKind.PERCENT,
            value: 10,
            usageLimit: 1,
            expiresAt,
            description: `Doğum günü ${year} — ${u.email}`,
            isActive: true,
          });
          discountId = d.id;
          break;
        } catch {
          /* kod çakışması veya doğrulama */
        }
      }
      if (!discountId) {
        failed += 1;
        this.log.warn(`Doğum günü kuponu oluşturulamadı: ${u.email}`);
        continue;
      }
      try {
        const mail = await this.email.birthdayCouponEmail({
          to: u.email,
          name: u.name,
          code,
          expiresAt: new Date(expiresAt),
          storeName: siteName,
        });
        if (!mail.ok) {
          failed += 1;
          await this.discounts.remove(discountId).catch(() => undefined);
          continue;
        }
        await this.prisma.birthdayCouponLog.create({
          data: { userId: u.id, year },
        });
        sent += 1;
      } catch (e) {
        failed += 1;
        if (discountId) await this.discounts.remove(discountId).catch(() => undefined);
        this.log.warn(`Doğum günü gönderimi hata: ${u.email} ${e instanceof Error ? e.message : e}`);
      }
    }
    this.log.log(`Doğum günü otomasyonu: sent=${sent} skipped=${skipped} failed=${failed}`);
    return { ok: true, sent, skippedExisting: skipped, failed, evaluated: due.length };
  }

  async listCampaigns() {
    return this.prisma.campaignMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        discountCode: { select: { id: true, code: true } },
        _count: { select: { recipients: true } },
      },
    });
  }

  async createCampaign(dto: CreateCampaignDto) {
    let discountCodeId: string | null = null;
    if (dto.discountCodeId?.trim()) {
      const d = await this.prisma.discountCode.findUnique({ where: { id: dto.discountCodeId.trim() } });
      if (!d) throw new BadRequestException("İndirim kodu bulunamadı.");
      discountCodeId = d.id;
    }
    const couponExpiresAt = dto.couponExpiresAt ? new Date(dto.couponExpiresAt) : null;
    if (couponExpiresAt && Number.isNaN(couponExpiresAt.getTime())) {
      throw new BadRequestException("Geçersiz son kullanma tarihi.");
    }
    return this.prisma.campaignMessage.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        audience: dto.audience,
        channel: (dto.channel ?? "EMAIL").trim(),
        discountCodeId,
        ctaLink: dto.ctaLink?.trim() || null,
        couponExpiresAt,
        status: "DRAFT",
      },
      include: { discountCode: { select: { id: true, code: true } } },
    });
  }

  async campaignStats(id: string) {
    const c = await this.prisma.campaignMessage.findUnique({
      where: { id },
      include: {
        discountCode: { select: { id: true, code: true, kind: true, value: true } },
        recipients: {
          orderBy: { sentAt: "desc" },
          take: 200,
          select: { id: true, email: true, status: true, error: true, sentAt: true },
        },
      },
    });
    if (!c) throw new NotFoundException();
    return c;
  }

  async sendCampaign(id: string) {
    const campaign = await this.prisma.campaignMessage.findUnique({
      where: { id },
      include: { discountCode: true },
    });
    if (!campaign) throw new NotFoundException();
    if (campaign.status !== "DRAFT") {
      throw new BadRequestException("Yalnızca taslak kampanyalar gönderilebilir.");
    }

    const raw = await this.resolveRecipients(campaign.audience as CampaignAudience);
    const dedup = new Map<string, AudienceRecipient>();
    for (const u of raw) {
      if (u.email && !dedup.has(u.email.toLowerCase())) {
        dedup.set(u.email.toLowerCase(), u);
      }
    }
    const targets = [...dedup.values()];
    if (!targets.length) {
      throw new BadRequestException("Bu kitle için gönderilecek izinli alıcı bulunamadı.");
    }

    const settings = await this.prisma.siteSettings.findFirst();
    const wa = settings?.whatsappNumber?.replace(/\D/g, "") || null;

    await this.prisma.campaignMessage.update({
      where: { id },
      data: { status: "SENDING", recipientCount: targets.length, successCount: 0, failCount: 0 },
    });

    const recipientRows = await this.prisma.$transaction(
      targets.map((t) =>
        this.prisma.campaignRecipient.create({
          data: {
            campaignId: id,
            userId: t.userId,
            email: t.email,
            status: "PENDING",
          },
        }),
      ),
    );

    let ok = 0;
    let fail = 0;
    const errors: string[] = [];
    const perEmailGapMs = marketingEmailGapMs();
    const totalRecipients = recipientRows.length;
    let sentIndex = 0;

    for (let i = 0; i < recipientRows.length; i += BATCH) {
      const chunk = recipientRows.slice(i, i + BATCH);
      for (const rec of chunk) {
        try {
          const r = await this.email.campaignEmail({
            to: rec.email,
            title: campaign.title,
            bodyHtml: campaign.body.replace(/\n/g, "<br/>"),
            couponCode: campaign.discountCode?.code,
            ctaLink: campaign.ctaLink,
            couponExpiresAt: campaign.couponExpiresAt,
            channel: campaign.channel,
            whatsappDigits: wa,
          });
          if (r.ok) {
            ok += 1;
            await this.prisma.campaignRecipient.update({
              where: { id: rec.id },
              data: { status: "SENT", sentAt: new Date(), error: null },
            });
          } else {
            fail += 1;
            const msg = r.error ?? "Bilinmeyen hata";
            errors.push(`${rec.email}: ${msg}`);
            await this.prisma.campaignRecipient.update({
              where: { id: rec.id },
              data: { status: "FAILED", error: msg },
            });
          }
        } catch (e) {
          fail += 1;
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`${rec.email}: ${msg}`);
          await this.prisma.campaignRecipient.update({
            where: { id: rec.id },
            data: { status: "FAILED", error: msg },
          });
        }
        sentIndex += 1;
        if (perEmailGapMs > 0 && sentIndex < totalRecipients) await sleep(perEmailGapMs);
      }
      if (i + BATCH < recipientRows.length) await sleep(BATCH_PAUSE_MS);
    }

    const summary =
      errors.length > 0
        ? errors.slice(0, 20).join(" | ") + (errors.length > 20 ? " …" : "")
        : null;

    await this.prisma.campaignMessage.update({
      where: { id },
      data: {
        status: "COMPLETED",
        sentAt: new Date(),
        successCount: ok,
        failCount: fail,
        lastErrorSummary: summary,
      },
    });

    if (fail === 0) {
      void this.notifications.notifyCampaignSent(campaign.title, ok);
    } else {
      void this.notifications.notifyCampaignSentWithErrors(campaign.title, ok, fail);
    }

    // Çok alıcıda: BullMQ/SQS kuyruk + MARKETING_EMAIL_GAP_MS ile sağlayıcı hız sınırı önerilir.
    this.log.log(`Kampanya ${id} tamamlandı: ok=${ok} fail=${fail}`);
    return { ok: true, recipientCount: targets.length, successCount: ok, failCount: fail };
  }

  async listAbandonedCarts() {
    return this.prisma.abandonedCart.findMany({
      orderBy: { lastActivityAt: "desc" },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            marketingOptIn: true,
            kvkkAcceptedAt: true,
          },
        },
      },
    });
  }

  async remindAbandonedCart(userId: string, discountCode?: string) {
    const row = await this.prisma.abandonedCart.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!row || row.itemCount <= 0) throw new NotFoundException("Terk edilmiş sepet kaydı yok.");
    const u = row.user;
    if (!u.marketingOptIn || !u.kvkkAcceptedAt) {
      throw new BadRequestException("Bu müşterinin kampanya / KVKK izni yok; hatırlatma gönderilemez.");
    }
    let coupon: string | undefined;
    if (discountCode?.trim()) {
      const codeNorm = discountCode.trim().toUpperCase();
      const found = await this.prisma.discountCode.findFirst({
        where: { code: codeNorm, isActive: true },
      });
      if (!found) throw new BadRequestException("Kupon kodu bulunamadı.");
      coupon = found.code;
    }
    const lines = Array.isArray(row.snapshot)
      ? (row.snapshot as Array<{ title?: string; quantity?: number; slug?: string }>)
      : [];
    const base = (process.env.PUBLIC_STORE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const r = await this.email.abandonedCartEmail({
      to: u.email,
      lines: lines.map((l) => ({
        title: String(l.title ?? "Ürün"),
        quantity: Math.max(1, Number(l.quantity) || 1),
        slug: l.slug,
      })),
      totalCents: row.totalCents,
      couponCode: coupon,
      ctaHref: `${base}/cart`,
      storeBaseUrl: base,
    });
    if (!r.ok) throw new BadRequestException(r.error ?? "E-posta gönderilemedi.");
    return { ok: true };
  }
}
