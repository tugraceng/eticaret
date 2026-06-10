import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AppCacheService } from "../common/cache/app-cache.service";
import { PrismaService } from "../prisma/prisma.service";

type ProductWithRelations = {
  id: string;
  [key: string]: unknown;
};

const PRODUCTS_CACHE_TTL = 30_000;
const PRODUCTS_BYSLUG_CACHE_TTL = 30_000;
const PRODUCTS_BESTSELLERS_CACHE_TTL = 60_000;
const PRODUCTS_RELATED_CACHE_TTL = 60_000;

// Pagination kullanılmayan ham listelerde hard cap.
const UNPAGED_MAX = 60;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AppCacheService,
  ) {}

  /** Ürünle ilgili her mutation'dan sonra çağrılır; ürün listelerini / detay cache'ini temizler. */
  invalidate() {
    this.cache.delPrefix("products:");
  }

  private normalizeProductSlug(raw: string): string {
    const s = raw.trim().toLowerCase();
    return s.length >= 2 ? s : "urun";
  }

  /** Yeni ürün: istenen slug doluysa `-2`, `-3` … ile benzersiz adres üretir. */
  private async allocateUniqueProductSlug(desired: string): Promise<string> {
    const base = this.normalizeProductSlug(desired);
    const taken = async (slug: string) =>
      (await this.prisma.product.findUnique({ where: { slug }, select: { id: true } })) != null;
    if (!(await taken(base))) return base;
    for (let n = 2; n < 1000; n++) {
      const candidate = `${base}-${n}`;
      if (!(await taken(candidate))) return candidate;
    }
    throw new ConflictException("Ürün adresi (slug) için benzersiz bir değer üretilemedi.");
  }

  /** Seçilen kategori + tüm alt kategorilerindeki ürünler (tek seviye veya derin ağaç). */
  private async categoryIdsIncludingDescendants(rootId: string): Promise<string[]> {
    const rows = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
    const ids = new Set<string>([rootId]);
    const queue = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      for (const r of rows) {
        if (r.parentId === id && !ids.has(r.id)) {
          ids.add(r.id);
          queue.push(r.id);
        }
      }
    }
    return [...ids];
  }

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

  private toCatalogItem(
    p: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      priceCents: number;
      compareAtCents: number | null;
      images: unknown;
      category: unknown;
      isFeatured: boolean;
      isNew: boolean;
      trackStock: boolean;
      stock: number;
      avgRating: number;
      reviewCount: number;
      variants?: { id: string }[];
    },
  ) {
    const hasVariants = (p.variants?.length ?? 0) > 0;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      compareAtCents: p.compareAtCents,
      images: p.images,
      category: p.category,
      isFeatured: p.isFeatured,
      isNew: p.isNew,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
      hasVariants,
      trackStock: p.trackStock,
      stock: p.stock,
    };
  }

  private catalogInclude() {
    return {
      images: { orderBy: { sortOrder: "asc" as const } },
      category: true,
      variants: { where: { isActive: true }, select: { id: true } },
    };
  }

  async list(q?: string, categoryId?: string, opts?: { featuredOnly?: boolean }) {
    const featuredOnly = opts?.featuredOnly === true;
    const cacheable = !q; // arama yoksa cache'leyebiliriz
    const key = `products:list:q=${q ?? ""}|cat=${categoryId ?? ""}|feat=${featuredOnly ? 1 : 0}`;
    const loader = async () => {
      const catIds = categoryId ? await this.categoryIdsIncludingDescendants(categoryId) : undefined;
      const products = await this.prisma.product.findMany({
        where: {
          isPublished: true,
          ...(featuredOnly ? { isFeatured: true } : {}),
          ...(catIds?.length ? { categoryId: { in: catIds } } : {}),
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: featuredOnly ? { createdAt: "desc" } : { updatedAt: "desc" },
        take: UNPAGED_MAX, // bellek güvenliği için hard cap; /products/catalog pagination'lıdır
        include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
      });
      return this.withRatings(products);
    };
    return cacheable
      ? this.cache.getOrSet(key, PRODUCTS_CACHE_TTL, loader)
      : loader();
  }

  async catalog(input?: {
    q?: string;
    categoryId?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
    minAvgRating?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "popular" | "bestseller";
    page?: number;
    limit?: number;
    inStockOnly?: boolean;
    onSaleOnly?: boolean;
    featuredOnly?: boolean;
    newOnly?: boolean;
    brand?: string;
  }) {
    const qTrimmed = input?.q?.trim();
    const categoryTrimmed = input?.categoryId?.trim();

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

    const categoryIds =
      input?.categoryId?.trim() ? await this.categoryIdsIncludingDescendants(input.categoryId.trim()) : null;

    const where = {
      isPublished: true,
      ...(minRatingProductIds?.length ? { id: { in: minRatingProductIds } } : {}),
      ...(categoryIds?.length ? { categoryId: { in: categoryIds } } : {}),
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
              {
                variants: { none: { isActive: true } },
                trackStock: false,
              },
              {
                variants: { none: { isActive: true } },
                trackStock: true,
                stock: { gt: 0 },
              },
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
      ...(input?.onSaleOnly
        ? { compareAtCents: { gt: this.prisma.product.fields.priceCents } }
        : {}),
      ...(input?.featuredOnly ? { isFeatured: true } : {}),
      ...(input?.newOnly ? { isNew: true } : {}),
      ...(input?.brand?.trim()
        ? { brand: { equals: input.brand.trim(), mode: "insensitive" as const } }
        : {}),
    };

    const sort = input?.sort ?? "newest";
    const { page, limit, skip } = this.normalizePaging(input?.page, input?.limit);

    if (sort === "bestseller") {
      const allIds = await this.prisma.product.findMany({ where, select: { id: true } });
      const idList = allIds.map((x) => x.id);
      if (!idList.length) {
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
      const rows = await this.prisma.$queryRaw<Array<{ productId: string; qty: bigint }>>(
        Prisma.sql`
      SELECT oi."productId", SUM(oi."quantity")::bigint AS qty
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status IS DISTINCT FROM 'CANCELLED'::"OrderStatus"
        AND oi."productId" IN (${Prisma.join(idList)})
      GROUP BY oi."productId"
    `,
      );
      const qtyMap = new Map(rows.map((r) => [r.productId, Number(r.qty)]));
      idList.sort((a, b) => {
        const da = qtyMap.get(a) ?? 0;
        const db = qtyMap.get(b) ?? 0;
        if (db !== da) return db - da;
        return b.localeCompare(a);
      });
      const total = idList.length;
      const pageIds = idList.slice(skip, skip + limit);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      if (!pageIds.length) {
        return {
          items: [],
          page,
          limit,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        };
      }
      const products = await this.prisma.product.findMany({
        where: { id: { in: pageIds } },
        include: this.catalogInclude(),
      });
      const order = new Map(pageIds.map((id, i) => [id, i]));
      products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      const items = (await this.withRatings(products)).map((p) => this.toCatalogItem(p));
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

    const orderBy =
      sort === "price_asc"
        ? [{ sortOrder: "asc" as const }, { priceCents: "asc" as const }]
        : sort === "price_desc"
          ? [{ sortOrder: "asc" as const }, { priceCents: "desc" as const }]
          : sort === "popular"
            ? [{ sortOrder: "asc" as const }, { reviews: { _count: "desc" as const } }]
            : input?.featuredOnly
              ? [{ featuredSortOrder: "asc" as const }, { updatedAt: "desc" as const }]
              : [{ sortOrder: "asc" as const }, { updatedAt: "desc" as const }];

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: this.catalogInclude(),
      }),
    ]);
    const items = (await this.withRatings(products)).map((p) => this.toCatalogItem(p));
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
    return this.cache.getOrSet(
      `products:bestsellers:limit=${limit}`,
      PRODUCTS_BESTSELLERS_CACHE_TTL,
      () => this.bestsellersInner(limit),
    );
  }

  private async bestsellersInner(limit: number) {
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

  async listBrands() {
    const rows = await this.prisma.product.findMany({
      where: { isPublished: true, brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    });
    return rows.map((r) => r.brand).filter((b): b is string => Boolean(b?.trim()));
  }

  async reorderProducts(
    items: Array<{ id: string; sortOrder?: number; featuredSortOrder?: number }>,
  ) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.id },
          data: {
            ...(typeof item.sortOrder === "number" ? { sortOrder: item.sortOrder } : {}),
            ...(typeof item.featuredSortOrder === "number"
              ? { featuredSortOrder: item.featuredSortOrder }
              : {}),
          },
        }),
      ),
    );
    this.cache.delPrefix("products:");
    return this.listAdmin();
  }

  async listAdmin() {
    return this.prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
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
      productImageId?: string | null;
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
    const productImageId = await this.resolveVariantGalleryImage(productId, data.productImageId ?? null);
    const created = await this.prisma.productVariant.create({
      data: {
        productId,
        label: data.label.trim(),
        sku: data.sku?.trim() ? data.sku.trim() : null,
        priceCents: data.priceCents ?? null,
        stock: data.stock ?? 0,
        trackStock: data.trackStock ?? true,
        sortOrder,
        isActive: data.isActive ?? true,
        productImageId,
      },
    });
    this.invalidate();
    return created;
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
      productImageId: string | null;
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
      productImageId?: string | null;
    } = {};
    if (data.label !== undefined) patch.label = data.label.trim();
    if (data.sku !== undefined) patch.sku = data.sku?.trim() ? data.sku.trim() : null;
    if (data.priceCents !== undefined) patch.priceCents = data.priceCents;
    if (data.stock !== undefined) patch.stock = data.stock;
    if (data.trackStock !== undefined) patch.trackStock = data.trackStock;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.productImageId !== undefined) {
      patch.productImageId = await this.resolveVariantGalleryImage(productId, data.productImageId);
    }
    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: patch,
    });
    this.invalidate();
    return updated;
  }

  async removeVariant(productId: string, variantId: string) {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!existing) throw new NotFoundException();
    const removed = await this.prisma.productVariant.delete({ where: { id: variantId } });
    this.invalidate();
    return removed;
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
    const result = await this.prisma.$transaction(async (tx) => {
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
    this.invalidate();
    return result;
  }

  /** Sepet satırları için stok üst sınırı (lineKey → maxQty). */
  async stockLimitsForLines(
    lines: Array<{ lineKey: string; productId: string; productVariantId?: string | null }>,
  ) {
    if (!lines.length) return [];
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
      include: { variants: { where: { isActive: true } } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return lines.map((line) => {
      const p = byId.get(line.productId);
      if (!p) {
        return {
          lineKey: line.lineKey,
          trackStock: true,
          maxQty: 0,
          hasVariants: false,
          requiresVariant: false,
        };
      }
      const hasVariants = p.variants.length > 0;
      const variant = line.productVariantId
        ? p.variants.find((v) => v.id === line.productVariantId)
        : undefined;
      if (hasVariants && !variant) {
        return {
          lineKey: line.lineKey,
          trackStock: true,
          maxQty: 0,
          hasVariants: true,
          requiresVariant: true,
        };
      }
      if (variant) {
        const track = variant.trackStock;
        return {
          lineKey: line.lineKey,
          trackStock: track,
          maxQty: track ? Math.max(0, variant.stock) : null,
          hasVariants: true,
          requiresVariant: false,
        };
      }
      const track = p.trackStock;
      return {
        lineKey: line.lineKey,
        trackStock: track,
        maxQty: track ? Math.max(0, p.stock) : null,
        hasVariants: false,
        requiresVariant: false,
      };
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

  async incrementLinkClick(slug: string) {
    const trimmed = slug.trim();
    if (!trimmed) return { ok: false };
    const product = await this.prisma.product.findFirst({
      where: { slug: { equals: trimmed, mode: "insensitive" }, isPublished: true },
      select: { id: true },
    });
    if (!product) return { ok: false };
    await this.prisma.product.update({
      where: { id: product.id },
      data: { linkClickCount: { increment: 1 } },
    });
    return { ok: true };
  }

  async bySlug(slug: string) {
    const value = await this.cache.getOrSet(
      `products:bySlug:slug=${slug}`,
      PRODUCTS_BYSLUG_CACHE_TTL,
      async () => {
        const p = await this.prisma.product.findFirst({
          where: { slug, isPublished: true },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            category: true,
            variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          },
        });
        if (!p) return null;
        const [with_] = await this.withRatings([p]);
        return with_;
      },
    );
    if (!value) throw new NotFoundException();
    return value;
  }

  related(slug: string, take = 8) {
    return this.cache.getOrSet(
      `products:related:slug=${slug}|take=${take}`,
      PRODUCTS_RELATED_CACHE_TTL,
      () => this.relatedInner(slug, take),
    );
  }

  private async relatedInner(slug: string, take: number) {
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

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    seoKeywords?: string | null;
    seoCanonicalUrl?: string | null;
    seoOgImageUrl?: string | null;
    seoNoIndex?: boolean;
    priceCents: number;
    compareAtCents?: number | null;
    sku?: string | null;
    trackStock?: boolean;
    stock?: number;
    categoryId?: string;
    isPublished?: boolean;
    showPublicStockCount?: boolean;
    isFeatured?: boolean;
    isNew?: boolean;
  }) {
    const slug = await this.allocateUniqueProductSlug(data.slug);
    const created = await this.prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        metaTitle: data.metaTitle?.trim() ? data.metaTitle.trim() : null,
        metaDescription: data.metaDescription?.trim() ? data.metaDescription.trim() : null,
        seoKeywords: data.seoKeywords?.trim() ? data.seoKeywords.trim() : null,
        seoCanonicalUrl: data.seoCanonicalUrl?.trim() ? data.seoCanonicalUrl.trim() : null,
        seoOgImageUrl: data.seoOgImageUrl?.trim() ? data.seoOgImageUrl.trim() : null,
        seoNoIndex: data.seoNoIndex ?? false,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents ?? undefined,
        sku: data.sku?.trim() ? data.sku.trim() : null,
        trackStock: data.trackStock ?? true,
        stock: data.stock ?? 0,
        categoryId: data.categoryId,
        isPublished: data.isPublished ?? false,
        showPublicStockCount: data.showPublicStockCount ?? true,
        isFeatured: data.isFeatured ?? false,
        isNew: data.isNew ?? false,
      },
    });
    this.invalidate();
    return created;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      metaTitle: string | null;
      metaDescription: string | null;
      seoKeywords: string | null;
      seoCanonicalUrl: string | null;
      seoOgImageUrl: string | null;
      seoNoIndex: boolean;
      priceCents: number;
      compareAtCents: number | null;
      sku: string | null;
      trackStock: boolean;
      stock: number;
      categoryId: string | null;
      isPublished: boolean;
      showPublicStockCount: boolean;
      isFeatured: boolean;
      isNew: boolean;
    }>,
  ) {
    await this.ensure(id);
    const {
      metaTitle,
      metaDescription,
      seoKeywords,
      seoCanonicalUrl,
      seoOgImageUrl,
      seoNoIndex,
      slug: slugIn,
      ...rest
    } = data;
    const patch: Prisma.ProductUpdateInput = { ...rest };
    if (slugIn !== undefined) {
      const normalized = this.normalizeProductSlug(slugIn);
      const current = await this.prisma.product.findUnique({
        where: { id },
        select: { slug: true },
      });
      if (current && normalized !== current.slug) {
        const clash = await this.prisma.product.findUnique({
          where: { slug: normalized },
          select: { id: true },
        });
        if (clash && clash.id !== id) {
          throw new ConflictException(
            "Bu adres (slug) başka bir üründe kullanılıyor; farklı bir adres seçin.",
          );
        }
      }
      patch.slug = normalized;
    }
    if (metaTitle !== undefined) {
      patch.metaTitle = metaTitle?.trim() ? metaTitle.trim() : null;
    }
    if (metaDescription !== undefined) {
      patch.metaDescription = metaDescription?.trim() ? metaDescription.trim() : null;
    }
    if (seoKeywords !== undefined) {
      patch.seoKeywords = seoKeywords?.trim() ? seoKeywords.trim() : null;
    }
    if (seoCanonicalUrl !== undefined) {
      patch.seoCanonicalUrl = seoCanonicalUrl?.trim() ? seoCanonicalUrl.trim() : null;
    }
    if (seoOgImageUrl !== undefined) {
      patch.seoOgImageUrl = seoOgImageUrl?.trim() ? seoOgImageUrl.trim() : null;
    }
    if (seoNoIndex !== undefined) {
      patch.seoNoIndex = Boolean(seoNoIndex);
    }
    const updated = await this.prisma.product.update({ where: { id }, data: patch });
    this.invalidate();
    return updated;
  }

  async remove(id: string) {
    await this.ensure(id);
    const removed = await this.prisma.product.delete({ where: { id } });
    this.invalidate();
    return removed;
  }

  async addImage(productId: string, url: string, alt?: string) {
    await this.ensure(productId);
    const agg = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });
    const sortOrder = (agg._max.sortOrder ?? -1) + 1;
    const img = await this.prisma.productImage.create({
      data: { productId, url: url.trim(), alt: alt?.trim(), sortOrder },
    });
    this.invalidate();
    return img;
  }

  async removeImage(productId: string, imageId: string) {
    await this.ensure(productId);
    const img = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!img) throw new NotFoundException();
    await this.prisma.productImage.delete({ where: { id: imageId } });
    this.invalidate();
    return { ok: true };
  }

  async reorderProductImages(productId: string, orderedIds: string[]) {
    await this.ensure(productId);
    const rows = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });
    const existing = new Set(rows.map((r) => r.id));
    if (orderedIds.length !== existing.size || orderedIds.some((id) => !existing.has(id))) {
      throw new BadRequestException("Görsel sırası: tüm görsel kimlikleri ve yalnızca bu ürüne ait olanlar gönderilmelidir.");
    }
    await this.prisma.$transaction(
      orderedIds.map((imageId, index) =>
        this.prisma.productImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        }),
      ),
    );
    this.invalidate();
    return { ok: true };
  }

  /** Varyanta bağlı vitrin görseli — ürünle eşleşmezse hata. Boş / null = bağlantıyı kaldır */
  private async resolveVariantGalleryImage(
    productId: string,
    raw: string | null | undefined,
  ): Promise<string | null> {
    if (raw == null || String(raw).trim() === "") return null;
    const id = String(raw).trim();
    const img = await this.prisma.productImage.findFirst({
      where: { id, productId },
      select: { id: true },
    });
    if (!img) {
      throw new BadRequestException("Seçilen vitrin görseli bu ürüne ait değil veya bulunamadı.");
    }
    return img.id;
  }

  private async ensure(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
  }
}
