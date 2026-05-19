import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  track(event: string, path?: string, metadata?: object) {
    return this.prisma.analyticsEvent.create({
      data: {
        event,
        path: path ?? null,
        ...(metadata !== undefined ? { metadata: metadata as object } : {}),
      },
    });
  }

  summary() {
    return this.prisma.analyticsEvent.groupBy({
      by: ["event"],
      where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } },
      _count: { _all: true },
    });
  }

  async adminCounters() {
    const settings = await this.prisma.siteSettings.findFirst();
    const globalThreshold = settings?.lowStockThreshold ?? 5;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      pendingReviews,
      pendingReturns,
      products,
      pendingOrders,
      marketingOptInCount,
      abandonedCartCount,
      todayRevenueAgg,
      lastCampaign,
    ] = await Promise.all([
      this.prisma.review.count({ where: { isApproved: false } }),
      this.prisma.returnRequest.count({ where: { status: "PENDING" } }),
      this.prisma.product.findMany({
        where: { trackStock: true, isPublished: true },
        select: {
          stock: true,
          lowStockThreshold: true,
          variants: { where: { isActive: true }, select: { trackStock: true, stock: true } },
        },
      }),
      this.prisma.order.count({ where: { status: "PENDING" } }),
      this.prisma.user.count({
        where: {
          role: "CUSTOMER",
          marketingOptIn: true,
          kvkkAcceptedAt: { not: null },
        },
      }),
      Promise.all([
        this.prisma.abandonedCart.count({ where: { itemCount: { gt: 0 } } }),
        this.prisma.guestAbandonedCart.count({ where: { itemCount: { gt: 0 } } }),
      ]).then(([a, g]) => a + g),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: "CANCELLED" },
        },
        _sum: { totalCents: true },
      }),
      this.prisma.campaignMessage.findFirst({
        where: { status: "COMPLETED" },
        orderBy: { sentAt: "desc" },
        select: {
          title: true,
          successCount: true,
          failCount: true,
          recipientCount: true,
          sentAt: true,
        },
      }),
    ]);
    let lowStock = 0;
    for (const p of products) {
      const threshold = p.lowStockThreshold ?? globalThreshold;
      const vars = p.variants;
      if (!vars.length) {
        if (p.stock <= threshold) lowStock += 1;
      } else {
        for (const v of vars) {
          if (v.trackStock && v.stock <= threshold) lowStock += 1;
        }
      }
    }
    return {
      pendingReviews,
      pendingReturns,
      lowStock,
      pendingOrders,
      marketingOptInCount,
      abandonedCartCount,
      todayRevenueCents: todayRevenueAgg._sum.totalCents ?? 0,
      lastCampaign,
    };
  }
}
