import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CustomersService } from "./customers.service";

type ReqUser = Request & { user: { sub: string } };

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  surname?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/, {
    message: "Telefon TR cep formatında olmalı",
  })
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/, {
    message: "Telefon TR cep formatında olmalı",
  })
  phone?: string;

  @IsString()
  @MaxLength(300)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  line2?: string;

  @IsString()
  @MinLength(1, { message: "İlçe zorunlu" })
  @MaxLength(120)
  district!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @Length(5, 5)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class CartLineDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsOptional()
  @IsString()
  lineKey?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class UpsertCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines!: CartLineDto[];
}

@Controller("customers")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdminCustomers() {
    return this.customers.listAdminSummaries();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: ReqUser) {
    return this.customers.getMe(req.user.sub);
  }

  @Patch("me/profile")
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: ReqUser, @Body() dto: UpdateProfileDto) {
    return this.customers.updateProfile(req.user.sub, dto);
  }

  @Post("me/password")
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: ReqUser, @Body() dto: ChangePasswordDto) {
    return this.customers.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  @Get("me/addresses")
  @UseGuards(JwtAuthGuard)
  listAddresses(@Req() req: ReqUser) {
    return this.customers.listAddresses(req.user.sub);
  }

  @Post("me/addresses")
  @UseGuards(JwtAuthGuard)
  addAddress(@Req() req: ReqUser, @Body() dto: AddressDto) {
    return this.customers.addAddress(req.user.sub, dto);
  }

  @Put("me/addresses/:id")
  @UseGuards(JwtAuthGuard)
  updateAddress(@Req() req: ReqUser, @Param("id") id: string, @Body() dto: AddressDto) {
    return this.customers.updateAddress(req.user.sub, id, dto);
  }

  @Delete("me/addresses/:id")
  @UseGuards(JwtAuthGuard)
  removeAddress(@Req() req: ReqUser, @Param("id") id: string) {
    return this.customers.removeAddress(req.user.sub, id);
  }

  @Post("me/addresses/:id/default")
  @UseGuards(JwtAuthGuard)
  setDefault(@Req() req: ReqUser, @Param("id") id: string) {
    return this.customers.setDefaultAddress(req.user.sub, id);
  }

  @Get("me/cart")
  @UseGuards(JwtAuthGuard)
  getCart(@Req() req: ReqUser) {
    return this.customers.getCart(req.user.sub);
  }

  @Put("me/cart")
  @UseGuards(JwtAuthGuard)
  putCart(@Req() req: ReqUser, @Body() dto: UpsertCartDto) {
    return this.customers.replaceCart(req.user.sub, dto.lines ?? []);
  }

  @Post("me/cart/merge")
  @UseGuards(JwtAuthGuard)
  mergeCart(@Req() req: ReqUser, @Body() dto: UpsertCartDto) {
    return this.customers.mergeCart(req.user.sub, dto.lines ?? []);
  }
}
