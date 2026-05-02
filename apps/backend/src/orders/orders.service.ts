import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DiscountsService } from "../discounts/discounts.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";

type CreateOrderInput = {
  items: { productId: string; quantity: number; productVariantId?: string }[];
  guestEmail?: string;
  buyerUserId?: string;
  contactName: string;
  contactPhone: string;
  identityNumber?: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingDistrict?: string;
  shippingCity: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  notes?: string;
  kvkkAccepted: boolean;
  distanceSalesAccepted: boolean;
  saveAddress?: boolean;
  addressLabel?: string;
  discountCode?: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly discounts: DiscountsService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async create(input: CreateOrderInput) {
    if (!input.items?.length) throw new BadRequestException("Sepet boş");
    if (!input.kvkkAccepted) {
      throw new BadRequestException("KVKK aydınlatma metnini onaylamanız gerekir.");
    }
    if (!input.distanceSalesAccepted) {
      throw new BadRequestException("Mesafeli Satış Sözleşmesini onaylamanız gerekir.");
    }

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((i) => i.productId) }, isPublished: true },
        include: { variants: { where: { isActive: true } } },
      });
      if (products.length !== input.items.length) {
        throw new BadRequestException("Bazı ürünler artık mevcut değil");
      }
      let subtotal = 0;
      const lines: {
        productId: string;
        productVariantId: string | null;
        variantLabelSnapshot: string | null;
        quantity: number;
        unitPriceCents: number;
        titleSnapshot: string;
      }[] = [];
      for (const line of input.items) {
        const p = products.find((x) => x.id === line.productId)!;
        const hasVariants = p.variants.length > 0;
        const variant = line.productVariantId
          ? p.variants.find((v) => v.id === line.productVariantId)
          : undefined;
        if (line.productVariantId && !variant) {
          throw new BadRequestException(`"${p.name}" için seçenek geçersiz veya kullanılamıyor`);
        }
        if (hasVariants && !variant) {
          throw new BadRequestException(`"${p.name}" için bir seçenek seçmelisiniz`);
        }
        if (!hasVariants && variant) {
          throw new BadRequestException(`"${p.name}" için seçenek kullanılamaz`);
        }
        const unitPrice = variant ? (variant.priceCents ?? p.priceCents) : p.priceCents;
        if (variant) {
          if (variant.trackStock && variant.stock < line.quantity) {
            throw new BadRequestException(`"${p.name}" (${variant.label}) için yeterli stok yok`);
          }
        } else if (p.trackStock && p.stock < line.quantity) {
          throw new BadRequestException(`"${p.name}" için yeterli stok yok`);
        }
        subtotal += unitPrice * line.quantity;
        lines.push({
          productId: p.id,
          productVariantId: variant?.id ?? null,
          variantLabelSnapshot: variant?.label ?? null,
          quantity: line.quantity,
          unitPriceCents: unitPrice,
          titleSnapshot: variant ? `${p.name} — ${variant.label}` : p.name,
        });
      }

      // Link / create customer record
      let customerId: string | undefined;
      if (input.buyerUserId) {
        const user = await tx.user.findUnique({
          where: { id: input.buyerUserId },
          include: { customer: true },
        });
        if (user) {
          if (user.customer) {
            customerId = user.customer.id;
          } else {
            const c = await tx.customer.create({
              data: {
                email: user.email,
                name: user.name,
                surname: user.surname,
                phone: user.phone ?? input.contactPhone,
                userId: user.id,
              },
            });
            customerId = c.id;
          }
        }
      } else if (input.guestEmail) {
        const existing = await tx.customer.findUnique({ where: { email: input.guestEmail } });
        if (existing) {
          customerId = existing.id;
        } else {
          const c = await tx.customer.create({
            data: {
              email: input.guestEmail,
              name: input.contactName.split(/\s+/)[0] || null,
              phone: input.contactPhone,
            },
          });
          customerId = c.id;
        }
      }

      // Kargo hesaplama: şehir bazlı matris → ülke → SiteSettings fallback
      const settings = await tx.siteSettings.findFirst();
      const country = (input.shippingCountry ?? "TR").toUpperCase();
      const cityNorm = input.shippingCity?.trim() || null;
      const rate =
        (cityNorm
          ? await tx.shippingRate.findFirst({
              where: {
                isActive: true,
                country,
                city: { equals: cityNorm, mode: "insensitive" },
              },
              orderBy: { sortOrder: "asc" },
            })
          : null) ??
        (await tx.shippingRate.findFirst({
          where: { isActive: true, country, city: null },
          orderBy: { sortOrder: "asc" },
        }));
      const rateFee = rate?.feeCents ?? settings?.shippingFeeCents ?? 0;
      const rateFree = rate?.freeThresholdCents ?? settings?.freeShippingThresholdCents ?? 0;
      const shippingCents =
        rateFee > 0 && (rateFree === 0 || subtotal < rateFree) ? rateFee : 0;

      // İndirim (kupon) hesaplama
      let discountCents = 0;
      let discountCodeUsed: string | null = null;
      let discountId: string | null = null;
      if (input.discountCode && input.discountCode.trim()) {
        const d = await this.discounts.validate(input.discountCode.trim(), subtotal);
        discountCents = d.discountCents;
        discountCodeUsed = d.code;
        discountId = d.id;
      }

      // KDV hesabı
      const taxBp = settings?.taxRateBp ?? 0;
      const taxIncluded = settings?.taxIncluded ?? true;
      const taxBase = Math.max(0, subtotal - discountCents);
      const taxCents =
        taxBp > 0
          ? taxIncluded
            ? Math.round((taxBase * taxBp) / (10000 + taxBp))
            : Math.round((taxBase * taxBp) / 10000)
          : 0;

      const totalCents =
        Math.max(0, subtotal - discountCents) +
        shippingCents +
        (taxIncluded ? 0 : taxCents);

      const order = await tx.order.create({
        data: {
          customerId,
          guestEmail: input.guestEmail,
          buyerUserId: input.buyerUserId,
          status: "PENDING",
          subtotalCents: subtotal,
          shippingCents,
          taxCents,
          discountCents,
          discountCode: discountCodeUsed,
          totalCents,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          identityNumber: input.identityNumber || null,
          shippingLine1: input.shippingLine1,
          shippingLine2: input.shippingLine2 || null,
          shippingDistrict: input.shippingDistrict || null,
          shippingCity: input.shippingCity,
          shippingPostalCode: input.shippingPostalCode || null,
          notes: input.notes || null,
          kvkkAcceptedAt: new Date(),
          distanceSalesAcceptedAt: new Date(),
          items: { create: lines },
        },
        include: { items: true },
      });

      if (discountId) {
        await tx.discountCode.update({
          where: { id: discountId },
          data: { usageCount: { increment: 1 } },
        });
      }

      const lowStockAlerts: { id: string; name: string; stock: number; threshold: number }[] = [];
      for (const line of lines) {
        const p = products.find((x) => x.id === line.productId)!;
        if (line.productVariantId) {
          const updated = await tx.productVariant.update({
            where: { id: line.productVariantId },
            data: { stock: { decrement: line.quantity } },
            select: { id: true, stock: true, label: true },
          });
          await tx.stockMovement.create({
            data: {
              productId: p.id,
              productVariantId: line.productVariantId,
              delta: -line.quantity,
              reason: "order_create",
              orderId: order.id,
            },
          });
          const threshold = p.lowStockThreshold ?? settings?.lowStockThreshold ?? 5;
          if (updated.stock <= threshold) {
            lowStockAlerts.push({
              id: p.id,
              name: `${p.name} (${updated.label})`,
              stock: updated.stock,
              threshold,
            });
          }
        } else if (p.trackStock) {
          const updated = await tx.product.update({
            where: { id: p.id },
            data: { stock: { decrement: line.quantity } },
            select: { id: true, name: true, stock: true, lowStockThreshold: true },
          });
          await tx.stockMovement.create({
            data: {
              productId: p.id,
              delta: -line.quantity,
              reason: "order_create",
              orderId: order.id,
            },
          });
          const threshold = updated.lowStockThreshold ?? settings?.lowStockThreshold ?? 5;
          if (updated.stock <= threshold) {
            lowStockAlerts.push({
              id: updated.id,
              name: updated.name,
              stock: updated.stock,
              threshold,
            });
          }
        }
      }

      if (input.saveAddress && customerId) {
        const existingCount = await tx.address.count({ where: { customerId } });
        await tx.address.create({
          data: {
            customerId,
            label: input.addressLabel || null,
            contactName: input.contactName,
            phone: input.contactPhone,
            line1: input.shippingLine1,
            line2: input.shippingLine2 || null,
            district: input.shippingDistrict || null,
            city: input.shippingCity,
            postalCode: input.shippingPostalCode || "",
            isDefault: existingCount === 0,
          },
        });
      }

      this.email.orderCreated({
        orderId: order.id,
        guestEmail: input.guestEmail,
        totalCents: order.totalCents,
        currency: order.currency,
      });
      void this.notifications.notifyNewOrder(
        order.id,
        order.totalCents,
        order.currency,
        input.guestEmail,
      );
      for (const alert of lowStockAlerts) {
        void this.notifications.notifyStock(alert.id, alert.name, alert.stock, alert.threshold);
        this.email.stockAlert({
          productName: alert.name,
          stock: alert.stock,
          outOfStock: alert.stock <= 0,
        });
      }
      return order;
    });
  }

  listMine(buyerUserId: string) {
    return this.prisma.order.findMany({
      where: { buyerUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        items: { select: { titleSnapshot: true, quantity: true }, take: 5 },
      },
    });
  }

  async getPublic(id: string) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        subtotalCents: true,
        shippingCents: true,
        taxCents: true,
        discountCents: true,
        discountCode: true,
        totalCents: true,
        currency: true,
        trackingNumber: true,
        createdAt: true,
        contactName: true,
        contactPhone: true,
        shippingLine1: true,
        shippingLine2: true,
        shippingDistrict: true,
        shippingCity: true,
        shippingPostalCode: true,
        shippingCountry: true,
        notes: true,
        buyerUserId: true,
        items: {
          select: { id: true, quantity: true, titleSnapshot: true, unitPriceCents: true },
        },
        returns: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            reason: true,
            items: { select: { orderItemId: true, quantity: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!o) throw new NotFoundException();
    return o;
  }

  async cancelByCustomer(id: string, userId: string) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new NotFoundException();
    if (o.buyerUserId !== userId) throw new ForbiddenException();
    if (o.status !== "PENDING") {
      throw new BadRequestException("Sadece beklemedeki siparişler iptal edilebilir");
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      // Stok iadesi
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const it of items) {
        if (it.productVariantId) {
          const v = await tx.productVariant.findUnique({ where: { id: it.productVariantId } });
          if (v?.trackStock) {
            await tx.productVariant.update({
              where: { id: it.productVariantId },
              data: { stock: { increment: it.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                productId: it.productId,
                productVariantId: it.productVariantId,
                delta: it.quantity,
                reason: "order_cancel",
                orderId: id,
              },
            });
          }
          continue;
        }
        const p = await tx.product.findUnique({ where: { id: it.productId } });
        if (p && p.trackStock) {
          await tx.product.update({
            where: { id: p.id },
            data: { stock: { increment: it.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: p.id,
              delta: it.quantity,
              reason: "order_cancel",
              orderId: id,
            },
          });
        }
      }
      return updated;
    });
  }

  listAdmin() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 100,
    });
  }

  async adminInsights(daysRaw?: number) {
    const days = Math.min(Math.max(Number(daysRaw) || 30, 1), 90);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    since.setUTCHours(0, 0, 0, 0);

    const statusOk = { not: "CANCELLED" as const };

    const [ordersSlice, topGroups, recentOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: since }, status: statusOk },
        select: { createdAt: true, totalCents: true, currency: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { createdAt: { gte: since }, status: statusOk } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 12,
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          createdAt: true,
          status: true,
          totalCents: true,
          currency: true,
          guestEmail: true,
          contactName: true,
          contactPhone: true,
          customer: { select: { email: true, name: true, phone: true } },
        },
      }),
    ]);

    const byDay = new Map<string, { revenueCents: number; orders: number }>();
    for (const o of ordersSlice) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { revenueCents: 0, orders: 0 };
      cur.revenueCents += o.totalCents;
      cur.orders += 1;
      byDay.set(key, cur);
    }
    const daily = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, revenueCents: v.revenueCents, orders: v.orders }));

    const productIds = topGroups.map((g) => g.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const prodMap = new Map(products.map((p) => [p.id, p]));
    const bestsellers = topGroups.map((g) => ({
      productId: g.productId,
      quantitySold: g._sum.quantity ?? 0,
      name: prodMap.get(g.productId)?.name ?? "Ürün",
      slug: prodMap.get(g.productId)?.slug ?? "",
    }));

    const crm = recentOrders.map((r) => ({
      orderId: r.id,
      at: r.createdAt,
      status: r.status,
      email: r.customer?.email ?? r.guestEmail,
      name: r.customer?.name ?? r.contactName,
      phone: r.customer?.phone ?? r.contactPhone,
      totalCents: r.totalCents,
      currency: r.currency,
    }));

    return { days, daily, bestsellers, crm };
  }

  async updateStatus(
    id: string,
    status: "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  ) {
    const current = await this.prisma.order.findUnique({ where: { id } });
    if (!current) throw new NotFoundException();
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
    });
    if (status === "SHIPPED" && current.status !== "SHIPPED") {
      await this.sendShippedNotification(updated);
    }
    return updated;
  }

  async getAdmin(id: string) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: { select: { id: true, email: true, name: true, surname: true, phone: true } },
      },
    });
    if (!o) throw new NotFoundException();
    return o;
  }

  async updateAdmin(
    id: string,
    data: Partial<{
      contactName: string;
      contactPhone: string;
      shippingLine1: string;
      shippingLine2: string | null;
      shippingDistrict: string | null;
      shippingCity: string;
      shippingPostalCode: string | null;
      trackingNumber: string | null;
      notes: string | null;
    }>,
  ) {
    const before = await this.prisma.order.findUnique({ where: { id } });
    if (!before) throw new NotFoundException();
    const after = await this.prisma.order.update({ where: { id }, data });
    // Takip numarası güncellendiyse ve sipariş SHIPPED durumundaysa tekrar bildirim gönder.
    const trackingChanged =
      typeof data.trackingNumber === "string" &&
      (data.trackingNumber ?? "").trim() !== (before.trackingNumber ?? "").trim();
    if (after.status === "SHIPPED" && trackingChanged && after.trackingNumber) {
      await this.sendShippedNotification(after);
    }
    return after;
  }

  private async sendShippedNotification(order: {
    id: string;
    contactPhone: string | null;
    contactName: string | null;
    trackingNumber: string | null;
  }) {
    if (!order.contactPhone || !order.trackingNumber) return;
    try {
      await this.whatsapp.notifyShipped({
        orderId: order.id,
        customerPhone: order.contactPhone,
        customerName: order.contactName,
        trackingNumber: order.trackingNumber,
      });
    } catch {
      // bildirim hatası sipariş akışını kırmasın
    }
  }

  private async ensure(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new NotFoundException();
  }
}
