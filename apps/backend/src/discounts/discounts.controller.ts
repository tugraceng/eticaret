import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { DiscountKind } from "@prisma/client";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { DiscountsService } from "./discounts.service";

class CreateDiscountDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsEnum(DiscountKind)
  kind!: DiscountKind;

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotalCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string | null;
}

class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsEnum(DiscountKind)
  kind?: DiscountKind;

  @IsOptional()
  @IsInt()
  @Min(1)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotalCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string | null;
}

class ValidateDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsInt()
  @Min(0)
  subtotalCents!: number;
}

@Controller("discounts")
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  list() {
    return this.discounts.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateDiscountDto) {
    return this.discounts.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param("id") id: string, @Body() dto: UpdateDiscountDto) {
    return this.discounts.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param("id") id: string) {
    return this.discounts.remove(id);
  }

  @Post("validate")
  validate(@Body() dto: ValidateDto) {
    return this.discounts.validate(dto.code, dto.subtotalCents);
  }
}
