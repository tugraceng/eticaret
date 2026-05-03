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
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { HomeSectionKind } from "@prisma/client";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SettingsService } from "./settings.service";

class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  siteName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  faviconUrl?: string | null;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string | null;

  @IsOptional()
  @IsString()
  fontFamily?: string | null;

  @IsOptional()
  @IsString()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  defaultMetaTitle?: string | null;

  @IsOptional()
  @IsString()
  defaultMetaDesc?: string | null;

  @IsOptional()
  @IsString()
  ogImageUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  shippingFeeCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  freeShippingThresholdCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  taxRateBp?: number;

  @IsOptional()
  @IsBoolean()
  taxIncluded?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappNumber?: string | null;

  @IsOptional()
  @IsString()
  whatsappGreeting?: string | null;

  @IsOptional()
  @IsString()
  whatsappPhoneId?: string | null;

  @IsOptional()
  @IsString()
  whatsappAccessToken?: string | null;

  @IsOptional()
  @IsString()
  whatsappShippedTemplate?: string | null;

  @IsOptional()
  @IsString()
  whatsappTemplateLang?: string;

  @IsOptional()
  @IsBoolean()
  popupEnabled?: boolean;

  @IsOptional()
  @IsString()
  popupTitle?: string | null;

  @IsOptional()
  @IsString()
  popupBody?: string | null;

  @IsOptional()
  @IsString()
  popupCtaLabel?: string | null;

  @IsOptional()
  @IsString()
  popupCtaHref?: string | null;

  @IsOptional()
  @IsString()
  popupImageUrl?: string | null;

  @IsOptional()
  @IsIn(["sm", "md", "lg", "xl", "full"])
  popupSize?: string;

  @IsOptional()
  @IsBoolean()
  popupDismissBackdrop?: boolean;

  @IsOptional()
  @IsBoolean()
  popupSessionOnly?: boolean;

  @IsOptional()
  @IsString()
  popupStorageKey?: string;

  @IsOptional()
  @IsString()
  topPromoLine1?: string;

  @IsOptional()
  @IsString()
  topPromoLine2?: string;

  @IsOptional()
  @IsString()
  topPromoLine3?: string;

  @IsOptional()
  @IsString()
  topPromoBgColor?: string;

  @IsOptional()
  @IsString()
  topPromoTextColor?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(300)
  topPromoMarqueeDurationSec?: number;

  @IsOptional()
  @IsString()
  authPanelTitle?: string;

  @IsOptional()
  @IsString()
  authPanelSubtitle?: string;

  @IsOptional()
  @IsString()
  authPanelImageUrl?: string | null;

  @IsOptional()
  @IsString()
  authPanelGradientFrom?: string;

  @IsOptional()
  @IsString()
  authPanelGradientTo?: string;

  @IsOptional()
  @IsString()
  authPanelTextColor?: string;

  @IsOptional()
  @IsBoolean()
  shopRailLeftEnabled?: boolean;

  @IsOptional()
  @IsString()
  shopRailLeftTitle?: string;

  @IsOptional()
  @IsString()
  shopRailLeftBody?: string;

  @IsOptional()
  @IsString()
  shopRailLeftCode?: string;

  @IsOptional()
  @IsString()
  shopRailLeftCtaLabel?: string;

  @IsOptional()
  @IsString()
  shopRailLeftCtaHref?: string;

  @IsOptional()
  @IsBoolean()
  shopRailRightEnabled?: boolean;

  @IsOptional()
  @IsString()
  shopRailRightTitle?: string;

  @IsOptional()
  @IsString()
  shopRailRightBody?: string;

  @IsOptional()
  @IsString()
  shopRailRightCode?: string;

  @IsOptional()
  @IsString()
  shopRailRightCtaLabel?: string;

  @IsOptional()
  @IsString()
  shopRailRightCtaHref?: string;

  @IsOptional()
  @IsBoolean()
  birthdayCouponAutomationEnabled?: boolean;
}

class CreateHomeSectionDto {
  @IsEnum(HomeSectionKind)
  kind!: HomeSectionKind;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  body?: string | null;

  @IsOptional()
  @IsString()
  mediaUrl?: string | null;

  @IsOptional()
  @IsString()
  ctaLabel?: string | null;

  @IsOptional()
  @IsString()
  ctaHref?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class UpdateHomeSectionDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  body?: string | null;

  @IsOptional()
  @IsString()
  mediaUrl?: string | null;

  @IsOptional()
  @IsString()
  ctaLabel?: string | null;

  @IsOptional()
  @IsString()
  ctaHref?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("settings")
  getSettings() {
    return this.settings.getPublicSettings();
  }

  @Get("settings/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAdminSettings() {
    return this.settings.getSettings();
  }

  @Patch("settings")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settings.updateSettings(dto);
  }

  @Get("home-sections")
  listHomeSections(@Query("all") all?: string) {
    return this.settings.listHomeSections({ onlyVisible: all !== "1" });
  }

  @Get("home-sections/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  listHomeSectionsAdmin() {
    return this.settings.listHomeSections();
  }

  @Post("home-sections")
  @UseGuards(JwtAuthGuard, AdminGuard)
  createHomeSection(@Body() dto: CreateHomeSectionDto) {
    return this.settings.createHomeSection(dto);
  }

  @Patch("home-sections/reorder")
  @UseGuards(JwtAuthGuard, AdminGuard)
  reorderHomeSections(@Body() dto: ReorderDto) {
    return this.settings.reorderHomeSections(dto.ids);
  }

  @Patch("home-sections/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateHomeSection(@Param("id") id: string, @Body() dto: UpdateHomeSectionDto) {
    return this.settings.updateHomeSection(id, dto);
  }

  @Delete("home-sections/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeHomeSection(@Param("id") id: string) {
    return this.settings.removeHomeSection(id);
  }
}
