import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  Allow,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ProductsService } from "./products.service";

class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

class AdjustStockDto {
  @IsInt()
  delta!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

class AddProductImageDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string;
}

class CreateProductVariantDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  /** Ürün varsayılan fiyatını kullanmak için göndermeyin veya null */
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsInt()
  @Min(0)
  priceCents?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined)
  @IsString()
  sku?: string | null;

  @IsOptional()
  @Allow()
  @ValidateIf((_, v) => v != null)
  @IsInt()
  @Min(0)
  priceCents?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query("q") q?: string, @Query("categoryId") categoryId?: string, @Query("ids") ids?: string) {
    if (ids) {
      const list = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return this.products.listByIds(list);
    }
    return this.products.list(q, categoryId);
  }

  @Get("catalog")
  catalog(
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("minPriceCents") minPriceCents?: string,
    @Query("maxPriceCents") maxPriceCents?: string,
    @Query("minAvgRating") minAvgRating?: string,
    @Query("sort") sort?: "newest" | "price_asc" | "price_desc" | "popular",
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("inStock") inStock?: string,
  ) {
    const min = minPriceCents ? Number(minPriceCents) : undefined;
    const max = maxPriceCents ? Number(maxPriceCents) : undefined;
    const mar = minAvgRating ? Number(minAvgRating) : undefined;
    const p = page ? Number(page) : undefined;
    const l = limit ? Number(limit) : undefined;
    const inStockOnly = inStock === "1" || inStock === "true";
    return this.products.catalog({
      q,
      categoryId,
      minPriceCents: Number.isFinite(min) ? min : undefined,
      maxPriceCents: Number.isFinite(max) ? max : undefined,
      minAvgRating: Number.isFinite(mar) ? mar : undefined,
      sort,
      page: Number.isFinite(p) ? p : undefined,
      limit: Number.isFinite(l) ? l : undefined,
      inStockOnly: inStockOnly || undefined,
    });
  }

  @Get("bestsellers")
  bestsellers(@Query("limit") limit?: string) {
    const l = limit ? Number(limit) : undefined;
    return this.products.bestsellers(Number.isFinite(l) ? l : undefined);
  }

  @Get("suggest")
  suggest(@Query("q") q?: string, @Query("limit") limit?: string) {
    const l = limit ? Number(limit) : undefined;
    return this.products.suggest(q, Number.isFinite(l) ? l : undefined);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdmin() {
    return this.products.listAdmin();
  }

  @Get("admin/stock-movements")
  @UseGuards(JwtAuthGuard, AdminGuard)
  stockMovements(@Query("productId") productId?: string) {
    return this.products.listStockMovements(productId);
  }

  @Get("admin/low-stock")
  @UseGuards(JwtAuthGuard, AdminGuard)
  lowStock() {
    return this.products.listLowStock();
  }

  @Post("admin/:id/adjust-stock")
  @UseGuards(JwtAuthGuard, AdminGuard)
  adjustStock(@Param("id") id: string, @Body() body: AdjustStockDto) {
    return this.products.adjustStock(id, body.delta, body.note);
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard, AdminGuard)
  addImage(@Param("id") id: string, @Body() dto: AddProductImageDto) {
    return this.products.addImage(id, dto.url, dto.alt);
  }

  @Post(":id/variants")
  @UseGuards(JwtAuthGuard, AdminGuard)
  createVariant(@Param("id") id: string, @Body() dto: CreateProductVariantDto) {
    return this.products.createVariant(id, dto);
  }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.products.bySlug(slug);
  }

  @Get(":slug/related")
  related(@Param("slug") slug: string) {
    return this.products.related(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateVariant(
    @Param("id") productId: string,
    @Param("variantId") variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.products.updateVariant(productId, variantId, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeVariant(@Param("id") productId: string, @Param("variantId") variantId: string) {
    return this.products.removeVariant(productId, variantId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}
