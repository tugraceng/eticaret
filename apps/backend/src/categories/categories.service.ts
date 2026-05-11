import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AppCacheService } from "../common/cache/app-cache.service";
import { PrismaService } from "../prisma/prisma.service";

const CACHE_KEY_LIST = "categories:list";
const CACHE_TTL_MS = 60_000;

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AppCacheService,
  ) {}

  list() {
    return this.cache.getOrSet(CACHE_KEY_LIST, CACHE_TTL_MS, () =>
      this.prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      }),
    );
  }

  private invalidate() {
    this.cache.delPrefix("categories:");
    // Ürün listeleri kategori sayılarını/filtrelerini kullandığından onları da geçersiz kıl.
    this.cache.delPrefix("products:");
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new BadRequestException("Üst kategori bulunamadı.");
    }
    const slug = data.slug.trim().toLowerCase();
    const created = await this.prisma.category.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim(),
        parentId: data.parentId,
        sortOrder: data.sortOrder ?? 0,
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
      parentId: string | null;
      sortOrder: number;
    }>,
  ) {
    await this.ensure(id);
    const patch = { ...data };
    if (patch.slug) patch.slug = patch.slug.trim().toLowerCase();
    if (patch.name) patch.name = patch.name.trim();
    if (patch.parentId !== undefined && patch.parentId !== null) {
      if (patch.parentId === id) throw new BadRequestException("Kategori kendi üst kategorisi olamaz.");
      const all = await this.prisma.category.findMany({ select: { id: true, parentId: true } });
      let cur: string | null = patch.parentId;
      const seen = new Set<string>();
      while (cur) {
        if (cur === id) throw new BadRequestException("Döngüsel üst kategori seçilemez.");
        if (seen.has(cur)) break;
        seen.add(cur);
        cur = all.find((x) => x.id === cur)?.parentId ?? null;
      }
    }
    const updated = await this.prisma.category.update({ where: { id }, data: patch });
    this.invalidate();
    return updated;
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.$transaction([
      this.prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      this.prisma.category.delete({ where: { id } }),
    ]);
    this.invalidate();
    return { ok: true };
  }

  private async ensure(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
  }
}
