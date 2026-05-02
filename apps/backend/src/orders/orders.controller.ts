import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import type { Request } from "express";
import type { UserRole } from "@prisma/client";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { OrdersService } from "./orders.service";

type ReqUser = Request & { user?: { sub: string; role: UserRole } };

class LineDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineDto)
  items!: LineDto[];

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  // Teslimat / iletişim — zorunlu
  @IsString()
  @IsNotEmpty({ message: "Ad Soyad zorunlu" })
  @MaxLength(120)
  contactName!: string;

  @IsString()
  @Matches(/^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/, {
    message: "Telefon TR cep formatında olmalı",
  })
  contactPhone!: string;

  // T.C. Kimlik No — opsiyonel ama verilirse 11 haneli olmalı
  @IsOptional()
  @IsString()
  @Length(11, 11, { message: "T.C. Kimlik No 11 haneli olmalı" })
  @Matches(/^\d{11}$/, { message: "T.C. Kimlik No sadece rakam içermeli" })
  identityNumber?: string;

  @IsString()
  @IsNotEmpty({ message: "Adres zorunlu" })
  @MaxLength(300)
  shippingLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shippingLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingDistrict?: string;

  @IsString()
  @IsNotEmpty({ message: "Şehir zorunlu" })
  @MaxLength(80)
  shippingCity!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: "Posta kodu 5 haneli olmalı" })
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  shippingCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsBoolean()
  kvkkAccepted!: boolean;

  @IsBoolean()
  distanceSalesAccepted!: boolean;

  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  addressLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  discountCode?: string;
}

class UpdateStatusDto {
  @IsEnum(["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const)
  status!: "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

class UpdateAdminOrderDto {
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;
  @IsOptional() @IsString() @MaxLength(40) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(300) shippingLine1?: string;
  @IsOptional() @IsString() @MaxLength(300) shippingLine2?: string;
  @IsOptional() @IsString() @MaxLength(120) shippingDistrict?: string;
  @IsOptional() @IsString() @MaxLength(80) shippingCity?: string;
  @IsOptional() @IsString() @MaxLength(20) shippingPostalCode?: string;
  @IsOptional() @IsString() @MaxLength(120) trackingNumber?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Req() req: ReqUser) {
    const buyerUserId = req.user?.role === "CUSTOMER" ? req.user.sub : undefined;
    return this.orders.create({
      items: dto.items,
      guestEmail: dto.guestEmail,
      buyerUserId,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      identityNumber: dto.identityNumber,
      shippingLine1: dto.shippingLine1,
      shippingLine2: dto.shippingLine2,
      shippingDistrict: dto.shippingDistrict,
      shippingCity: dto.shippingCity,
      shippingPostalCode: dto.shippingPostalCode,
      shippingCountry: dto.shippingCountry,
      notes: dto.notes,
      kvkkAccepted: dto.kvkkAccepted,
      distanceSalesAccepted: dto.distanceSalesAccepted,
      saveAddress: dto.saveAddress,
      addressLabel: dto.addressLabel,
      discountCode: dto.discountCode,
    });
  }

  @Post(":id/cancel")
  @UseGuards(JwtAuthGuard)
  cancel(@Param("id") id: string, @Req() req: Request & { user: { sub: string } }) {
    return this.orders.cancelByCustomer(id, req.user.sub);
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdmin() {
    return this.orders.listAdmin();
  }

  @Get("admin/insights")
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminInsights(@Query("days") days?: string) {
    const d = days ? Number(days) : undefined;
    return this.orders.adminInsights(Number.isFinite(d) ? d : undefined);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  listMine(@Req() req: Request & { user: { sub: string } }) {
    return this.orders.listMine(req.user.sub);
  }

  @Patch("admin/:id/status")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }

  @Get("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAdmin(@Param("id") id: string) {
    return this.orders.getAdmin(id);
  }

  @Patch("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateAdmin(@Param("id") id: string, @Body() dto: UpdateAdminOrderDto) {
    const data: Record<string, unknown> = {};
    if (dto.contactName !== undefined) data.contactName = dto.contactName;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.shippingLine1 !== undefined) data.shippingLine1 = dto.shippingLine1;
    if (dto.shippingLine2 !== undefined) data.shippingLine2 = dto.shippingLine2 || null;
    if (dto.shippingDistrict !== undefined) data.shippingDistrict = dto.shippingDistrict || null;
    if (dto.shippingCity !== undefined) data.shippingCity = dto.shippingCity;
    if (dto.shippingPostalCode !== undefined) data.shippingPostalCode = dto.shippingPostalCode || null;
    if (dto.trackingNumber !== undefined) data.trackingNumber = dto.trackingNumber || null;
    if (dto.notes !== undefined) data.notes = dto.notes || null;
    return this.orders.updateAdmin(id, data);
  }

  @Get(":id")
  track(@Param("id") id: string) {
    return this.orders.getPublic(id);
  }
}
