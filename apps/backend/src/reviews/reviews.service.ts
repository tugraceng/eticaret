import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException();
    const [items, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId: product.id, isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          authorName: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      this.prisma.review.aggregate({
        where: { productId: product.id, isApproved: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        author: r.user?.name ?? r.authorName ?? "Misafir",
        createdAt: r.createdAt,
      })),
      average: agg._avg.rating ?? 0,
      count: agg._count._all,
    };
  }

  async create(
    slug: string,
    data: { rating: number; title?: string; body: string; authorName?: string },
    userId?: string,
  ) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException("rating 1..5 olmalı");
    }
    const body = (data.body || "").trim();
    if (body.length < 5) {
      throw new BadRequestException("Yorum en az 5 karakter olmalı");
    }
    const product = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      select: { id: true },
    });
    if (!product) throw new NotFoundException();

    return this.prisma.review.create({
      data: {
        productId: product.id,
        userId: userId ?? null,
        rating: data.rating,
        title: data.title?.trim() || null,
        body,
        authorName: userId ? null : data.authorName?.trim() || null,
        // Üyeler otomatik onaylı, misafir yorumları admin onayı bekler
        isApproved: Boolean(userId),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.review.delete({ where: { id } });
  }

  async setApproved(id: string, isApproved: boolean) {
    return this.prisma.review.update({ where: { id }, data: { isApproved } });
  }

  async listAdmin(filter?: "all" | "pending" | "approved") {
    const where =
      filter === "pending"
        ? { isApproved: false }
        : filter === "approved"
          ? { isApproved: true }
          : undefined;
    return this.prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
