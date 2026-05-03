import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { GuestAbandonDto } from "./dto/guest-abandon.dto";
import { MarketingService } from "./marketing.service";

/**
 * Misafir sepet anlık görüntüsü — kimlik doğrulaması yok.
 * IP başına istek üst sınırı: {@link ThrottlerGuard} (`THROTTLE_TTL_MS` / `THROTTLE_LIMIT`, reverse proxy için `TRUST_PROXY=1`, çok instance için `REDIS_URL`).
 */
@Controller("cart")
@UseGuards(ThrottlerGuard)
export class GuestCartController {
  constructor(private readonly marketing: MarketingService) {}

  @Post("guest-abandon")
  guestAbandon(@Body() dto: GuestAbandonDto) {
    return this.marketing.upsertGuestAbandonedCart(dto);
  }
}
