import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import Redis from "ioredis";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DiscountsModule } from "../discounts/discounts.module";
import { MarketingController } from "./marketing.controller";
import { GuestCartController } from "./guest-cart.controller";
import { MarketingCronService } from "./marketing-cron.service";
import { MarketingService } from "./marketing.service";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ttlRaw = config.get<string>("THROTTLE_TTL_MS");
        const limitRaw = config.get<string>("THROTTLE_LIMIT");
        const ttl = Math.max(1000, Number(ttlRaw) || 60_000);
        const limit = Math.max(1, Math.floor(Number(limitRaw) || 48));
        const redisUrl = config.get<string>("REDIS_URL")?.trim();
        if (redisUrl) {
          return {
            throttlers: [{ ttl, limit }],
            storage: new ThrottlerStorageRedisService(
              new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
              }),
            ),
          };
        }
        return { throttlers: [{ ttl, limit }] };
      },
    }),
    PrismaModule,
    EmailModule,
    NotificationsModule,
    DiscountsModule,
  ],
  controllers: [MarketingController, GuestCartController],
  providers: [MarketingService, MarketingCronService],
  exports: [MarketingService],
})
export class MarketingModule {}
