import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import {
  AbandonedRemindDto,
  CAMPAIGN_AUDIENCES,
  CreateCampaignDto,
  type CampaignAudience,
} from "./dto/create-campaign.dto";
import { MarketingService } from "./marketing.service";

@Controller("admin/marketing")
@UseGuards(JwtAuthGuard, AdminGuard)
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Get("abandoned-carts")
  listAbandoned() {
    return this.marketing.listAbandonedCarts();
  }

  @Post("abandoned-carts/:userId/remind")
  remindAbandoned(@Param("userId") userId: string, @Body() dto: AbandonedRemindDto) {
    return this.marketing.remindAbandonedCart(userId, dto.discountCode);
  }

  @Get("guest-abandoned-carts")
  listGuestAbandoned() {
    return this.marketing.listGuestAbandonedCarts();
  }

  @Post("guest-abandoned-carts/:id/remind")
  remindGuestAbandoned(@Param("id") id: string, @Body() dto: AbandonedRemindDto) {
    return this.marketing.remindGuestAbandonedCart(id, dto.discountCode);
  }

  @Post("birthday-run")
  runBirthdayAutomation() {
    return this.marketing.runBirthdayAutomation();
  }

  @Get("campaigns/preview")
  preview(@Query("audience") audience: string, @Query("channel") channel?: string) {
    if (!(CAMPAIGN_AUDIENCES as readonly string[]).includes(audience)) {
      throw new BadRequestException("Geçersiz kitle parametresi.");
    }
    return this.marketing.previewAudience(audience as CampaignAudience, channel);
  }

  @Get("campaigns")
  listCampaigns() {
    return this.marketing.listCampaigns();
  }

  @Post("campaigns")
  create(@Body() dto: CreateCampaignDto) {
    return this.marketing.createCampaign(dto);
  }

  @Get("campaigns/:id/stats")
  stats(@Param("id") id: string) {
    return this.marketing.campaignStats(id);
  }

  @Post("campaigns/:id/send")
  send(@Param("id") id: string) {
    return this.marketing.sendCampaign(id);
  }
}
