import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AppCacheService } from "../common/cache/app-cache.service";
import { PrismaService } from "../prisma/prisma.service";

const KEY_BLOG_LIST = "cms:blog:list";
const KEY_SERVICES_LIST = "cms:services:list";
const KEY_PROJECTS_LIST = "cms:projects:list";
const KEY_PAGES_LIST = "cms:pages:list";
const KEY_BLOG_BYSLUG = (slug: string) => `cms:blog:slug=${slug}`;
const KEY_SERVICE_BYSLUG = (slug: string) => `cms:services:slug=${slug}`;
const KEY_PROJECT_BYSLUG = (slug: string) => `cms:projects:slug=${slug}`;
const KEY_PAGE_BYSLUG = (slug: string) => `cms:pages:slug=${slug}`;
const TTL_MS = 120_000;

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AppCacheService,
  ) {}

  // Blog
  listPosts() {
    return this.cache.getOrSet(KEY_BLOG_LIST, TTL_MS, () =>
      this.prisma.blogPost.findMany({
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
      }),
    );
  }

  listPostsAdmin() {
    return this.prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  }

  async postBySlug(slug: string) {
    const cached = await this.cache.getOrSet(KEY_BLOG_BYSLUG(slug), TTL_MS, () =>
      this.prisma.blogPost.findFirst({ where: { slug, publishedAt: { not: null } } }),
    );
    if (!cached) throw new NotFoundException();
    return cached;
  }

  async createPost(data: {
    slug: string;
    title: string;
    excerpt?: string;
    body: string;
    coverImageUrl?: string;
    publish?: boolean;
  }) {
    const created = await this.prisma.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        coverImageUrl: data.coverImageUrl,
        publishedAt: data.publish ? new Date() : null,
      },
    });
    this.cache.delPrefix("cms:blog:");
    return created;
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

    const updated = await this.prisma.blogPost.update({
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
    this.cache.delPrefix("cms:blog:");
    return updated;
  }

  async deletePost(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.blogPost.delete({ where: { id } });
    this.cache.delPrefix("cms:blog:");
    return { ok: true };
  }

  // Services
  listServices() {
    return this.cache.getOrSet(KEY_SERVICES_LIST, TTL_MS, () =>
      this.prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    );
  }

  async serviceBySlug(slug: string) {
    const s = await this.cache.getOrSet(KEY_SERVICE_BYSLUG(slug), TTL_MS, () =>
      this.prisma.service.findUnique({ where: { slug } }),
    );
    if (!s) throw new NotFoundException();
    return s;
  }

  async createService(data: { slug: string; title: string; summary?: string; description: string }) {
    const created = await this.prisma.service.create({ data });
    this.cache.delPrefix("cms:services:");
    return created;
  }

  // Projects
  listProjects() {
    return this.cache.getOrSet(KEY_PROJECTS_LIST, TTL_MS, () =>
      this.prisma.project.findMany({ orderBy: { completedAt: "desc" } }),
    );
  }

  async projectBySlug(slug: string) {
    const p = await this.cache.getOrSet(KEY_PROJECT_BYSLUG(slug), TTL_MS, () =>
      this.prisma.project.findUnique({ where: { slug } }),
    );
    if (!p) throw new NotFoundException();
    return p;
  }

  async createProject(data: {
    slug: string;
    title: string;
    summary?: string;
    description: string;
    gallery?: unknown;
  }) {
    const created = await this.prisma.project.create({
      data: {
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        description: data.description,
        gallery: (data.gallery ?? []) as object,
      },
    });
    this.cache.delPrefix("cms:projects:");
    return created;
  }

  // Pages
  listPages() {
    return this.cache.getOrSet(KEY_PAGES_LIST, TTL_MS, () =>
      this.prisma.page.findMany({ where: { isPublished: true } }),
    );
  }

  async pageBySlug(slug: string) {
    // Slug unique: findUnique (btree) + kod tarafı isPublished kontrolü daha hızlı.
    const p = await this.cache.getOrSet(KEY_PAGE_BYSLUG(slug), TTL_MS, () =>
      this.prisma.page.findUnique({ where: { slug } }),
    );
    if (!p || !p.isPublished) throw new NotFoundException();
    return p;
  }

  /** Yönetim paneli: taslak dahil tek kayıt (yoksa null). */
  async pageAdminBySlug(slug: string) {
    return this.prisma.page.findUnique({ where: { slug } });
  }

  async upsertPage(data: { slug: string; title: string; content?: unknown; isPublished?: boolean }) {
    const result = await this.prisma.page.upsert({
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
    this.cache.delPrefix("cms:pages:");
    return result;
  }
}
