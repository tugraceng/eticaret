import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { Allow, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CmsService } from "./cms.service";

class BlogPostDto {
  @IsString()
  @MinLength(2)
  slug!: string;
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  excerpt?: string;
  @IsString()
  body!: string;
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

class BlogPostPatchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  excerpt?: string;
  @IsOptional()
  @IsString()
  body?: string;
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

class ServiceDto {
  @IsString()
  slug!: string;
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  summary?: string;
  @IsString()
  description!: string;
  @IsOptional()
  @Allow()
  @IsString()
  iconUrl?: string | null;
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ServicePatchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @Allow()
  @IsString()
  summary?: string | null;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @Allow()
  @IsString()
  iconUrl?: string | null;
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ProjectDto {
  @IsString()
  slug!: string;
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  summary?: string;
  @IsString()
  description!: string;
  @IsOptional()
  gallery?: unknown[];
  @IsOptional()
  @IsString()
  completedAt?: string | null;
}

class ProjectPatchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @Allow()
  @IsString()
  summary?: string | null;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  gallery?: unknown[];
  @IsOptional()
  @Allow()
  @IsString()
  completedAt?: string | null;
}

class PageDto {
  @IsString()
  slug!: string;
  @IsString()
  title!: string;
  @IsOptional()
  @Allow()
  content?: Record<string, unknown>;
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

@Controller("cms")
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Get("blog")
  blogList() {
    return this.cms.listPosts();
  }

  @Get("blog/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  blogAdmin() {
    return this.cms.listPostsAdmin();
  }

  @Get("blog/admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  blogAdminById(@Param("id") id: string) {
    return this.cms.postByIdAdmin(id);
  }

  @Get("blog/:slug")
  blogBySlug(@Param("slug") slug: string) {
    return this.cms.postBySlug(slug);
  }

  @Post("blog")
  @UseGuards(JwtAuthGuard, AdminGuard)
  blogCreate(@Body() dto: BlogPostDto) {
    return this.cms.createPost(dto);
  }

  @Patch("blog/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  blogPatch(@Param("id") id: string, @Body() dto: BlogPostPatchDto) {
    return this.cms.updatePost(id, dto);
  }

  @Delete("blog/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  blogDelete(@Param("id") id: string) {
    return this.cms.deletePost(id);
  }

  @Get("services")
  services() {
    return this.cms.listServices();
  }

  @Get("services/:slug")
  serviceBySlug(@Param("slug") slug: string) {
    return this.cms.serviceBySlug(slug);
  }

  @Post("services")
  @UseGuards(JwtAuthGuard, AdminGuard)
  serviceCreate(@Body() dto: ServiceDto) {
    return this.cms.createService({
      slug: dto.slug,
      title: dto.title,
      summary: dto.summary,
      description: dto.description,
      iconUrl: dto.iconUrl,
      sortOrder: dto.sortOrder,
    });
  }

  @Get("services/admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  serviceAdminById(@Param("id") id: string) {
    return this.cms.serviceByIdAdmin(id);
  }

  @Patch("services/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  servicePatch(@Param("id") id: string, @Body() dto: ServicePatchDto) {
    return this.cms.updateService(id, dto);
  }

  @Delete("services/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  serviceDelete(@Param("id") id: string) {
    return this.cms.deleteService(id);
  }

  @Get("projects")
  projects() {
    return this.cms.listProjects();
  }

  @Get("projects/:slug")
  projectBySlug(@Param("slug") slug: string) {
    return this.cms.projectBySlug(slug);
  }

  @Post("projects")
  @UseGuards(JwtAuthGuard, AdminGuard)
  projectCreate(@Body() dto: ProjectDto) {
    return this.cms.createProject({
      slug: dto.slug,
      title: dto.title,
      summary: dto.summary,
      description: dto.description,
      gallery: dto.gallery,
      completedAt: dto.completedAt,
    });
  }

  @Get("projects/admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  projectAdminById(@Param("id") id: string) {
    return this.cms.projectByIdAdmin(id);
  }

  @Patch("projects/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  projectPatch(@Param("id") id: string, @Body() dto: ProjectPatchDto) {
    return this.cms.updateProject(id, dto);
  }

  @Delete("projects/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  projectDelete(@Param("id") id: string) {
    return this.cms.deleteProject(id);
  }

  @Get("pages")
  pages() {
    return this.cms.listPages();
  }

  @Get("admin/pages/:slug")
  @UseGuards(JwtAuthGuard, AdminGuard)
  pageAdminBySlug(@Param("slug") slug: string) {
    return this.cms.pageAdminBySlug(slug);
  }

  @Get("pages/:slug")
  pageBySlug(@Param("slug") slug: string) {
    return this.cms.pageBySlug(slug);
  }

  @Put("pages/:slug")
  @UseGuards(JwtAuthGuard, AdminGuard)
  pageUpsert(@Param("slug") slug: string, @Body() dto: PageDto) {
    return this.cms.upsertPage({ ...dto, slug });
  }
}
