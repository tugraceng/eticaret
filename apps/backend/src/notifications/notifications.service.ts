import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string, opts?: { unreadOnly?: boolean }) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(opts?.unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundException();
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { ok: true };
  }

  async notifyNewOrder(
    orderId: string,
    totalCents: number,
    currency: string,
    guestEmail?: string | null,
  ) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      if (!admins.length) return;
      const title = "Yeni sipariş";
      const body = `Sipariş #${orderId.slice(0, 8)}… — ${(totalCents / 100).toFixed(2)} ${currency}${guestEmail ? ` · ${guestEmail}` : ""}`;
      await this.prisma.$transaction(
        admins.map((u) =>
          this.prisma.notification.create({
            data: {
              userId: u.id,
              type: "order.new",
              title,
              body,
              metadata: { orderId },
            },
          }),
        ),
      );
    } catch (e) {
      this.log.warn(`notifyNewOrder failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  async notifyStock(
    productId: string,
    productName: string,
    stock: number,
    threshold: number,
  ) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      if (!admins.length) return;
      const outOf = stock <= 0;
      const title = outOf ? "Stok tükendi" : "Stok kritik seviyede";
      const body = outOf
        ? `"${productName}" ürünü stoksuz kaldı.`
        : `"${productName}" ürününde ${stock} adet kaldı (eşik: ${threshold}).`;
      await this.prisma.$transaction(
        admins.map((u) =>
          this.prisma.notification.create({
            data: {
              userId: u.id,
              type: outOf ? "stock.out" : "stock.low",
              title,
              body,
              metadata: { productId, stock, threshold },
            },
          }),
        ),
      );
    } catch (e) {
      this.log.warn(`notifyStock failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  async notifyCampaignSent(title: string, successCount: number) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      if (!admins.length) return;
      await this.prisma.$transaction(
        admins.map((u) =>
          this.prisma.notification.create({
            data: {
              userId: u.id,
              type: "marketing.campaign.ok",
              title: "Kampanya gönderimi tamamlandı",
              body: `"${title}" — ${successCount} alıcıya başarıyla iletildi.`,
              metadata: { title, successCount },
            },
          }),
        ),
      );
    } catch (e) {
      this.log.warn(`notifyCampaignSent failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  async notifyCampaignSentWithErrors(title: string, success: number, failed: number) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      if (!admins.length) return;
      await this.prisma.$transaction(
        admins.map((u) =>
          this.prisma.notification.create({
            data: {
              userId: u.id,
              type: "marketing.campaign.partial",
              title: "Kampanya gönderimi (kısmi hata)",
              body: `"${title}" — başarılı: ${success}, hatalı: ${failed}.`,
              metadata: { title, success, failed },
            },
          }),
        ),
      );
    } catch (e) {
      this.log.warn(`notifyCampaignSentWithErrors failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}
