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
import { EmailService } from "../email/email.service";
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
  @IsString()
  homeMetaTitle?: string | null;
  @IsOptional()
  @IsString()
  homeMetaDesc?: string | null;
  @IsOptional()
  @IsString()
  homeSeoKeywords?: string | null;
  @IsOptional()
  @IsString()
  homeCanonicalUrl?: string | null;
  @IsOptional()
  @IsString()
  homeOgImageUrl?: string | null;
  @IsOptional()
  @IsBoolean()
  homeNoIndex?: boolean;

  @IsOptional()
  @IsString()
  shopMetaTitle?: string | null;
  @IsOptional()
  @IsString()
  shopMetaDesc?: string | null;
  @IsOptional()
  @IsString()
  shopSeoKeywords?: string | null;
  @IsOptional()
  @IsString()
  shopCanonicalUrl?: string | null;
  @IsOptional()
  @IsString()
  shopOgImageUrl?: string | null;
  @IsOptional()
  @IsBoolean()
  shopNoIndex?: boolean;

  @IsOptional()
  @IsString()
  contactMetaTitle?: string | null;
  @IsOptional()
  @IsString()
  contactMetaDesc?: string | null;
  @IsOptional()
  @IsString()
  contactSeoKeywords?: string | null;
  @IsOptional()
  @IsString()
  contactCanonicalUrl?: string | null;
  @IsOptional()
  @IsString()
  contactOgImageUrl?: string | null;
  @IsOptional()
  @IsBoolean()
  contactNoIndex?: boolean;

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
  netgsmEnabled?: boolean;

  @IsOptional()
  @IsString()
  netgsmUsercode?: string | null;

  @IsOptional()
  @IsString()
  netgsmPassword?: string | null;

  @IsOptional()
  @IsString()
  netgsmMsgHeader?: string | null;

  @IsOptional()
  @IsString()
  netgsmSmsFilter?: string;

  @IsOptional()
  @IsString()
  netgsmShippedMessageTemplate?: string | null;

  @IsOptional()
  @IsBoolean()
  smtpEnabled?: boolean;

  @IsOptional()
  @IsString()
  smtpHost?: string | null;

  @IsOptional()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUsername?: string | null;

  @IsOptional()
  @IsString()
  smtpPassword?: string | null;

  @IsOptional()
  @IsString()
  smtpEncryption?: string;

  @IsOptional()
  @IsString()
  smtpFromEmail?: string | null;

  @IsOptional()
  @IsString()
  smtpFromName?: string | null;

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
  newsletterKicker?: string;

  @IsOptional()
  @IsString()
  newsletterHeading?: string;

  @IsOptional()
  @IsString()
  newsletterSubtitle?: string;

  @IsOptional()
  @IsString()
  newsletterBullets?: string;

  @IsOptional()
  @IsString()
  newsletterDisclaimer?: string;

  @IsOptional()
  @IsString()
  newsletterPlaceholder?: string;

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

  @IsOptional()
  @IsString()
  contactNavLabel?: string | null;

  @IsOptional()
  @IsString()
  contactNavHref?: string | null;

  @IsOptional()
  @Allow()
  headerNav?: unknown;

  @IsOptional()
  @IsBoolean()
  bankTransferEnabled?: boolean;

  @IsOptional()
  @IsString()
  bankTransferInstructions?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  returnWindowDays?: number;

  @IsOptional()
  @IsString()
  homeCraftKicker?: string;

  @IsOptional()
  @IsString()
  homeCraftTitle?: string;

  @IsOptional()
  @IsString()
  homeCraftBody?: string | null;

  @IsOptional()
  @IsString()
  homeCraftImageUrl?: string | null;
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
  @Allow()
  config?: unknown;

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
  @Allow()
  config?: unknown;

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
  constructor(
    private readonly settings: SettingsService,
    private readonly email: EmailService,
  ) {}

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
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    const updated = await this.settings.updateSettings(dto);
    await this.email.reloadFromSettings();
    return updated;
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

  @Get("bank-accounts")
  listBankAccountsPublic() {
    return this.settings.listBankAccountsPublic();
  }

  @Get("bank-accounts/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  listBankAccountsAdmin() {
    return this.settings.listBankAccountsAdmin();
  }

  @Post("bank-accounts/admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  createBankAccount(
    @Body()
    dto: {
      bankName: string;
      accountHolder: string;
      iban: string;
      branch?: string;
      notes?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.settings.createBankAccount(dto);
  }

  @Patch("bank-accounts/admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateBankAccount(
    @Param("id") id: string,
    @Body()
    dto: Partial<{
      bankName: string;
      accountHolder: string;
      iban: string;
      branch: string | null;
      notes: string | null;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    return this.settings.updateBankAccount(id, dto);
  }

  @Delete("bank-accounts/admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteBankAccount(@Param("id") id: string) {
    return this.settings.deleteBankAccount(id);
  }

  @Patch("bank-accounts/admin/reorder")
  @UseGuards(JwtAuthGuard, AdminGuard)
  reorderBankAccounts(@Body() dto: { ids: string[] }) {
    return this.settings.reorderBankAccounts(dto.ids ?? []);
  }
}
