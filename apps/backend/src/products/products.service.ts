import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type ProductWithRelations = {
  id: string;
  [key: string]: unknown;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePaging(pageRaw?: number, limitRaw?: number) {
    const page = Number.isFinite(pageRaw) && (pageRaw ?? 0) > 0 ? Math.floor(pageRaw as number) : 1;
    const limitBase =
      Number.isFinite(limitRaw) && (limitRaw ?? 0) > 0 ? Math.floor(limitRaw as number) : 12;
    const limit = Math.min(Math.max(limitBase, 1), 60);
    return { page, limit, skip: (page - 1) * limit };
  }

  private async withRatings<T extends ProductWithRelations>(
    products: T[],
  ): Promise<(T & { avgRating: number; reviewCount: number })[]> {
    if (!products.length) return [];
    const ids = products.map((p) => p.id);
    const grouped = await this.prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const map = new Map<string, { avg: number; count: number }>();
    for (const g of grouped) {
      map.set(g.productId, { avg: g._avg.rating ?? 0, count: g._count._all });
    }
    return products.map((p) => {
      const r = map.get(p.id);
      return { ...p, avgRating: r?.avg ?? 0, reviewCount: r?.count ?? 0 };
    });
  }

  async list(q?: string, categoryId?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        isPublished: true,
        ...(categoryId ? { categoryId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
    });
    return this.withRatings(products);
  }

  async catalog(input?: {
    q?: string;
    categoryId?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
    minAvgRating?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
    page?: number;
    limit?: number;
    inStockOnly?: boolean;
  }) {
    let minRatingProductIds: string[] | undefined;
    if (
      typeof input?.minAvgRating === "number" &&
      Number.isFinite(input.minAvgRating) &&
      input.minAvgRating >= 1 &&
      input.minAvgRating <= 5
    ) {
      const rows = await this.prisma.$queryRaw<Array<{ productId: string }>>`
        SELECT r."productId"
        FROM "Review" r
        WHERE r."isApproved" = true
        GROUP BY r."productId"
        HAVING AVG(r."rating")::double precision >= ${input.minAvgRating}
      `;
      minRatingProductIds = rows.map((r) => r.productId);
      if (minRatingProductIds.length === 0) {
        const { page, limit } = this.normalizePaging(input?.page, input?.limit);
        return {
          items: [],
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        };
      }
    }

    const where = {
      isPublished: true,
      ...(minRatingProductIds?.length ? { id: { in: minRatingProductIds } } : {}),
      ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input?.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" as const } },
              { description: { contains: input.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(typeof input?.minPriceCents === "number" || typeof input?.maxPriceCents === "number"
        ? {
            priceCents: {
              ...(typeof input?.minPriceCents === "number" ? { gte: input.minPriceCents } : {}),
              ...(typeof input?.maxPriceCents === "number" ? { lte: input.maxPriceCents } : {}),
            },
          }
        : {}),
      ...(input?.inStockOnly
        ? {
            OR: [
              { trackStock: false },
              { stock: { gt: 0 } },
              {
                variants: {
                  some: {
                    isActive: true,
                    OR: [{ trackStock: false }, { stock: { gt: 0 } }],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const sort = input?.sort ?? "newest";
    const orderBy =
      sort === "price_asc"
        ? ({ priceCents: "asc" } as const)
        : sort === "price_desc"
          ? ({ priceCents: "desc" } as const)
          : sort === "popular"
            ? ({ reviews: { _count: "desc" } } as const)
            : ({ updatedAt: "desc" } as const);

    const { page, limit, skip } = this.normalizePaging(input?.page, input?.limit);

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
      }),
    ]);
    const items = await this.withRatings(products);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    };
  }

  async bestsellers(limitRaw?: number) {
    const limit = Math.min(Math.max(limitRaw ?? 8, 1), 24);
    const rows = await this.prisma.$queryRaw<Array<{ productId: string; qty: bigint }>>`
      SELECT oi."productId", SUM(oi."quantity")::bigint AS qty
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status IS DISTINCT FROM 'CANCELLED'::"OrderStatus"
      GROUP BY oi."productId"
      ORDER BY qty DESC
      LIMIT ${limit}
    `;
    const ids = rows.map((r) => r.productId);
    if (!ids.length) {
      const fallback = await this.prisma.product.findMany({
        where: { isPublished: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
      });
      return this.withRatings(fallback);
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isPublished: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return this.withRatings(products);
  }

  async suggest(q?: string, limitRaw?: number) {
    const term = q?.trim();
    if (!term) return [];
    const limit = Math.min(Math.max(limitRaw ?? 8, 1), 12);
    return this.prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        priceCents: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    });
  }

  async listAdmin() {
    return this.prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async createVariant(
    productId: string,
    data: {
      label: string;
      sku?: string;
      priceCents?: number | null;
      stock?: number;
      trackStock?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.ensure(productId);
    const agg = await this.prisma.productVariant.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });
    const sortOrder =
      typeof data.sortOrder === "number"
        ? data.sortOrder
        : (agg._max.sortOrder ?? -1) + 1;
    return this.prisma.productVariant.create({
      data: {
        productId,
        label: data.label.trim(),
        sku: data.sku?.trim() ? data.sku.trim() : null,
        priceCents: data.priceCents ?? null,
        stock: data.stock ?? 0,
        trackStock: data.trackStock ?? true,
        sortOrder,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateVariant(
    productId: string,
    variantId: string,
    data: Partial<{
      label: string;
      sku: string | null;
      priceCents: number | null;
      stock: number;
      trackStock: boolean;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!existing) throw new NotFoundException();
    const patch: {
      label?: string;
      sku?: string | null;
      priceCents?: number | null;
      stock?: number;
      trackStock?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    } = {};
    if (data.label !== undefined) patch.label = data.label.trim();
    if (data.sku !== undefined) patch.sku = data.sku?.trim() ? data.sku.trim() : null;
    if (data.priceCents !== undefined) patch.priceCents = data.priceCents;
    if (data.stock !== undefined) patch.stock = data.stock;
    if (data.trackStock !== undefined) patch.trackStock = data.trackStock;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: patch,
    });
  }

  async removeVariant(productId: string, variantId: string) {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!existing) throw new NotFoundException();
    return this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  async listStockMovements(productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        product: { select: { id: true, name: true, slug: true, stock: true } },
        productVariant: { select: { id: true, label: true, stock: true } },
      },
    });
  }

  async listLowStock() {
    const settings = await this.prisma.siteSettings.findFirst();
    const globalThreshold = settings?.lowStockThreshold ?? 5;
    const products = await this.prisma.product.findMany({
      where: { trackStock: true, isPublished: true },
      orderBy: { name: "asc" },
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
      },
    });
    const rows: Array<{
      product: (typeof products)[0];
      threshold: number;
      variant?: { id: string; label: string; stock: number };
    }> = [];
    for (const p of products) {
      const threshold = p.lowStockThreshold ?? globalThreshold;
      const activeVariants = p.variants.filter((v) => v.isActive);
      if (activeVariants.length === 0) {
        if (p.stock <= threshold) rows.push({ product: p, threshold });
      } else {
        for (const v of activeVariants) {
          if (v.trackStock && v.stock <= threshold) {
            rows.push({
              product: p,
              threshold,
              variant: { id: v.id, label: v.label, stock: v.stock },
            });
          }
        }
      }
    }
    return rows.slice(0, 200);
  }

  async adjustStock(productId: string, delta: number, note?: string) {
    const p = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!p) throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          delta,
          reason: "admin_adjust",
          note: note?.trim() || null,
        },
      });
      return updated;
    });
  }

  async listByIds(ids: string[]) {
    if (!ids.length) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isPublished: true },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
    });
    return this.withRatings(products);
  }

  async bySlug(slug: string) {
    const p = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!p) throw new NotFoundException();
    const [with_] = await this.withRatings([p]);
    return with_;
  }

  async related(slug: string, take = 8) {
    const base = await this.prisma.product.findFirst({
      where: { slug, isPublished: true },
      select: { id: true, categoryId: true },
    });
    if (!base) throw new NotFoundException();

    const sameCategory = base.categoryId
      ? await this.prisma.product.findMany({
          where: {
            isPublished: true,
            id: { not: base.id },
            categoryId: base.categoryId,
          },
          include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
          orderBy: { updatedAt: "desc" },
          take,
        })
      : [];

    if (sameCategory.length >= take) return this.withRatings(sameCategory);

    const fillerCount = take - sameCategory.length;
    const excludeIds = [base.id, ...sameCategory.map((p) => p.id)];
    const fillers = await this.prisma.product.findMany({
      where: { isPublished: true, id: { notIn: excludeIds } },
      include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
      orderBy: { updatedAt: "desc" },
      take: fillerCount,
    });
    return this.withRatings([...sameCategory, ...fillers]);
  }

  create(data: {
    name: string;
    slug: string;
    description?: string;
    priceCents: number;
    compareAtCents?: number | null;
    sku?: string | null;
    trackStock?: boolean;
    stock?: number;
    categoryId?: string;
    isPublished?: boolean;
  }) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents ?? undefined,
        sku: data.sku?.trim() ? data.sku.trim() : null,
        trackStock: data.trackStock ?? true,
        stock: data.stock ?? 0,
        categoryId: data.categoryId,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      priceCents: number;
      compareAtCents: number | null;
      sku: string | null;
      trackStock: boolean;
      stock: number;
      categoryId: string | null;
      isPublished: boolean;
    }>,
  ) {
    await this.ensure(id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async addImage(productId: string, url: string, alt?: string) {
    await this.ensure(productId);
    const agg = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });
    const sortOrder = (agg._max.sortOrder ?? -1) + 1;
    return this.prisma.productImage.create({
      data: { productId, url: url.trim(), alt: alt?.trim(), sortOrder },
    });
  }

  private async ensure(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
  }
}
