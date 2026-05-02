import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  // Blog
  listPosts() {
    return this.prisma.blogPost.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });
  }

  listPostsAdmin() {
    return this.prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  }

  async postBySlug(slug: string) {
    const p = await this.prisma.blogPost.findFirst({
      where: { slug, publishedAt: { not: null } },
    });
    if (!p) throw new NotFoundException();
    return p;
  }

  createPost(data: {
    slug: string;
    title: string;
    excerpt?: string;
    body: string;
    coverImageUrl?: string;
    publish?: boolean;
  }) {
    return this.prisma.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        coverImageUrl: data.coverImageUrl,
        publishedAt: data.publish ? new Date() : null,
      },
    });
  }

  async postByIdAdmin(id: string) {
    const p = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
    return p;
  }

  async updatePost(
    id: string,
    data: {
      slug?: string;
      title?: string;
      excerpt?: string;
      body?: string;
      coverImageUrl?: string | null;
      publish?: boolean;
    },
  ) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    if (data.slug !== undefined && data.slug !== existing.slug) {
      const clash = await this.prisma.blogPost.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (clash) throw new ConflictException("Bu adres (slug) başka bir yazıda kullanılıyor.");
    }

    const nextPublished =
      data.publish !== undefined
        ? data.publish
          ? existing.publishedAt ?? new Date()
          : null
        : undefined;

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.excerpt !== undefined ? { excerpt: data.excerpt || null } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
        ...(nextPublished !== undefined ? { publishedAt: nextPublished } : {}),
      },
    });
  }

  async deletePost(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.blogPost.delete({ where: { id } });
    return { ok: true };
  }

  // Services
  listServices() {
    return this.prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async serviceBySlug(slug: string) {
    const s = await this.prisma.service.findUnique({ where: { slug } });
    if (!s) throw new NotFoundException();
    return s;
  }

  createService(data: { slug: string; title: string; summary?: string; description: string }) {
    return this.prisma.service.create({ data });
  }

  // Projects
  listProjects() {
    return this.prisma.project.findMany({ orderBy: { completedAt: "desc" } });
  }

  async projectBySlug(slug: string) {
    const p = await this.prisma.project.findUnique({ where: { slug } });
    if (!p) throw new NotFoundException();
    return p;
  }

  createProject(data: {
    slug: string;
    title: string;
    summary?: string;
    description: string;
    gallery?: unknown;
  }) {
    return this.prisma.project.create({
      data: {
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        description: data.description,
        gallery: (data.gallery ?? []) as object,
      },
    });
  }

  // Pages
  listPages() {
    return this.prisma.page.findMany({ where: { isPublished: true } });
  }

  async pageBySlug(slug: string) {
    const p = await this.prisma.page.findFirst({
      where: { slug, isPublished: true },
    });
    if (!p) throw new NotFoundException();
    return p;
  }

  upsertPage(data: { slug: string; title: string; content?: unknown; isPublished?: boolean }) {
    return this.prisma.page.upsert({
      where: { slug: data.slug },
      create: {
        slug: data.slug,
        title: data.title,
        content: data.content as object | undefined,
        isPublished: data.isPublished ?? true,
      },
      update: {
        title: data.title,
        content: data.content as object | undefined,
        isPublished: data.isPublished,
      },
    });
  }
}
