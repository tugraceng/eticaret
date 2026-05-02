import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
  }

  create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    const slug = data.slug.trim().toLowerCase();
    return this.prisma.category.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim(),
        parentId: data.parentId,
        sortOrder: data.sortOrder ?? 0,
      },
    });
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
    return this.prisma.category.update({ where: { id }, data: patch });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.$transaction([
      this.prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      this.prisma.category.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  private async ensure(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
  }
}
