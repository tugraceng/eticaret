import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";

type CreateReturnInput = {
  orderId: string;
  reason: string;
  items: { orderItemId: string; quantity: number }[];
  userId?: string;
};

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly payments: PaymentsService,
  ) {}

  async create(input: CreateReturnInput) {
    const reason = input.reason.trim();
    if (!reason) throw new BadRequestException("İade sebebi zorunlu.");
    if (!input.items?.length) throw new BadRequestException("En az bir kalem seçin.");

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (input.userId && order.buyerUserId && order.buyerUserId !== input.userId) {
      throw new ForbiddenException();
    }
    if (order.status !== "DELIVERED") {
      throw new BadRequestException(
        "İade talebi yalnızca teslim edilmiş siparişler için oluşturulabilir.",
      );
    }
    if (!order.deliveredAt) {
      throw new BadRequestException(
        "Teslim tarihi kaydı bulunamadı. Lütfen müşteri hizmetleri ile iletişime geçin.",
      );
    }
    const settings = await this.prisma.siteSettings.findFirst();
    const windowDays = settings?.returnWindowDays ?? 14;
    const deadline = new Date(order.deliveredAt);
    deadline.setDate(deadline.getDate() + windowDays);
    if (new Date() > deadline) {
      throw new BadRequestException(
        `İade süresi (${windowDays} gün) dolmuştur. Teslim: ${order.deliveredAt.toLocaleDateString("tr-TR")}`,
      );
    }

    const byId = new Map(order.items.map((i) => [i.id, i]));
    // Önceden iade edilmiş miktarları düş
    const existingReturns = await this.prisma.returnItem.findMany({
      where: { request: { orderId: order.id, status: { in: ["PENDING", "APPROVED", "COMPLETED"] } } },
      select: { orderItemId: true, quantity: true },
    });
    const alreadyMap = new Map<string, number>();
    for (const r of existingReturns) {
      alreadyMap.set(r.orderItemId, (alreadyMap.get(r.orderItemId) ?? 0) + r.quantity);
    }

    for (const line of input.items) {
      const item = byId.get(line.orderItemId);
      if (!item) throw new BadRequestException("Geçersiz sipariş kalemi.");
      if (line.quantity <= 0) throw new BadRequestException("Miktar pozitif olmalı.");
      const already = alreadyMap.get(line.orderItemId) ?? 0;
      if (line.quantity + already > item.quantity) {
        throw new BadRequestException(
          `"${item.titleSnapshot}" için iade edilebilir miktarı aşıyorsunuz.`,
        );
      }
    }

    const created = await this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: input.userId ?? null,
        reason,
        items: {
          create: input.items.map((l) => ({
            orderItemId: l.orderItemId,
            quantity: l.quantity,
          })),
        },
      },
      include: { items: true },
    });

    this.email.returnRequested({
      orderId: order.id,
      requesterEmail: order.guestEmail ?? null,
      reason,
    });

    return created;
  }

  listMine(userId: string) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: { include: { orderItem: { select: { titleSnapshot: true } } } },
        order: { select: { id: true, status: true, totalCents: true, currency: true } },
      },
    });
  }

  listAdmin(filter?: "all" | "pending" | "decided") {
    const where =
      filter === "pending"
        ? { status: "PENDING" as const }
        : filter === "decided"
          ? { status: { in: ["APPROVED", "REJECTED", "COMPLETED"] as Array<"APPROVED" | "REJECTED" | "COMPLETED"> } }
          : undefined;
    return this.prisma.returnRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        items: { include: { orderItem: { select: { titleSnapshot: true, productId: true } } } },
        order: {
          select: {
            id: true,
            status: true,
            totalCents: true,
            currency: true,
            guestEmail: true,
            contactName: true,
            contactPhone: true,
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async decide(
    id: string,
    decision: "APPROVED" | "REJECTED" | "COMPLETED",
    opts: { adminId: string; note?: string; restock?: boolean },
  ) {
    const req = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true, order: true },
    });
    if (!req) throw new NotFoundException();
    if (decision !== "COMPLETED" && req.status !== "PENDING") {
      throw new BadRequestException("Yalnızca bekleyen talepler onay/red alabilir.");
    }
    if (decision === "COMPLETED" && !["APPROVED"].includes(req.status)) {
      throw new BadRequestException("Yalnızca onaylı talepler tamamlanabilir.");
    }

    await this.prisma.$transaction(async (tx) => {
      const up = await tx.returnRequest.update({
        where: { id },
        data: {
          status: decision,
          decidedAt: new Date(),
          decidedBy: opts.adminId,
          note: opts.note?.trim() || req.note,
        },
      });

      if (decision === "COMPLETED" && opts.restock !== false) {
        for (const it of req.items) {
          const oi = await tx.orderItem.findUnique({ where: { id: it.orderItemId } });
          if (!oi) continue;
          const p = await tx.product.findUnique({ where: { id: oi.productId } });
          if (!p || !p.trackStock) continue;
          await tx.product.update({
            where: { id: p.id },
            data: { stock: { increment: it.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: p.id,
              delta: it.quantity,
              reason: "return",
              orderId: req.orderId,
              note: `Return #${req.id.slice(0, 8)}`,
            },
          });
        }
      }

      return up;
    });

    const notifyTo = req.order.guestEmail ?? null;
    if (notifyTo) {
      this.email.returnDecided({
        to: notifyTo,
        orderId: req.orderId,
        status: decision,
        note: opts.note ?? null,
      });
    }

    if (decision === "APPROVED") {
      try {
        const r = await this.payments.tryRefundForReturnApproved({
          returnRequestId: id,
          orderId: req.orderId,
          lines: req.items.map((it) => ({
            orderItemId: it.orderItemId,
            quantity: it.quantity,
          })),
        });
        await this.prisma.returnRequest.update({
          where: { id },
          data: {
            refundStatus: r.outcome,
            refundCents: r.cents,
            refundDetail: r.detail ?? null,
          },
        });
      } catch (e) {
        await this.prisma.returnRequest.update({
          where: { id },
          data: {
            refundStatus: "FAILED",
            refundCents: 0,
            refundDetail: e instanceof Error ? e.message.slice(0, 2000) : String(e).slice(0, 2000),
          },
        });
      }
    }

    const out = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: { include: { orderItem: { select: { titleSnapshot: true, productId: true } } } },
        order: {
          select: {
            id: true,
            status: true,
            totalCents: true,
            currency: true,
            guestEmail: true,
            contactName: true,
            contactPhone: true,
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!out) throw new NotFoundException();
    return out;
  }
}
