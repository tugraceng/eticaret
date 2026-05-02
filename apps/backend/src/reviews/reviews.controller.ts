import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";
import type { Request } from "express";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { ReviewsService } from "./reviews.service";

class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @MinLength(5)
  body!: string;

  @IsOptional()
  @IsString()
  authorName?: string;
}

type AuthedRequest = Request & { user?: { sub?: string } };

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get("products/:slug/reviews")
  list(@Param("slug") slug: string) {
    return this.reviews.listByProduct(slug);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post("products/:slug/reviews")
  create(
    @Param("slug") slug: string,
    @Body() dto: CreateReviewDto,
    @Req() req: AuthedRequest,
  ) {
    return this.reviews.create(slug, dto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/reviews")
  listAdmin(@Query("filter") filter?: string) {
    const valid = ["all", "pending", "approved"] as const;
    const f = (valid as readonly string[]).includes(filter ?? "")
      ? (filter as (typeof valid)[number])
      : "all";
    return this.reviews.listAdmin(f);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch("admin/reviews/:id")
  patch(@Param("id") id: string, @Body() body: { isApproved: boolean }) {
    return this.reviews.setApproved(id, Boolean(body.isApproved));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete("admin/reviews/:id")
  remove(@Param("id") id: string) {
    return this.reviews.remove(id);
  }
}
