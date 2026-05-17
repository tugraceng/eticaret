import { IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export const CAMPAIGN_AUDIENCES = [
  "ALL_OPT_IN",
  "LAST_30_SHOPPERS",
  "NEVER_ORDERED",
  "ABANDONED",
  "BIRTHDAY_7D",
] as const;

export type CampaignAudience = (typeof CAMPAIGN_AUDIENCES)[number];

export const CAMPAIGN_CHANNELS = ["EMAIL", "WHATSAPP_LINK", "SMS_READY", "SMS"] as const;

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(4)
  body!: string;

  @IsIn(CAMPAIGN_AUDIENCES as unknown as string[])
  audience!: CampaignAudience;

  @IsOptional()
  @IsIn(CAMPAIGN_CHANNELS as unknown as string[])
  channel?: string;

  @IsOptional()
  @IsString()
  discountCodeId?: string;

  @IsOptional()
  @IsString()
  ctaLink?: string;

  @IsOptional()
  @IsDateString()
  couponExpiresAt?: string;
}

export class AbandonedRemindDto {
  @IsOptional()
  @IsString()
  discountCode?: string;
}
