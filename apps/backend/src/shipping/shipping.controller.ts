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
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ShippingService } from "./shipping.service";

class CreateShippingDto {
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() city?: string | null;
  @IsInt() @Min(0) feeCents!: number;
  @IsOptional() @IsInt() @Min(0) freeThresholdCents?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

class UpdateShippingDto {
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() city?: string | null;
  @IsOptional() @IsInt() @Min(0) feeCents?: number;
  @IsOptional() @IsInt() @Min(0) freeThresholdCents?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

@Controller("shipping-rates")
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get("quote")
  quote(
    @Query("country") country?: string,
    @Query("city") city?: string,
    @Query("subtotalCents") subtotal?: string,
  ) {
    const n = Number(subtotal ?? "0");
    return this.service.quote({
      country: country ?? null,
      city: city ?? null,
      subtotalCents: Number.isFinite(n) && n >= 0 ? n : 0,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateShippingDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateShippingDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
