import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { CmsModule } from "./cms/cms.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { SettingsModule } from "./settings/settings.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { EmailModule } from "./email/email.module";
import { CategoriesModule } from "./categories/categories.module";
import { CustomersModule } from "./customers/customers.module";
import { DiscountsModule } from "./discounts/discounts.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ReturnsModule } from "./returns/returns.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { ShippingModule } from "./shipping/shipping.module";
import { WhatsAppModule } from "./whatsapp/whatsapp.module";
import { NetgsmModule } from "./netgsm/netgsm.module";
import { ContactModule } from "./contact/contact.module";
import { UploadsModule } from "./uploads/uploads.module";
import { MarketingModule } from "./marketing/marketing.module";
import { EinvoiceModule } from "./einvoice/einvoice.module";
import { PerfModule } from "./common/perf/perf.module";
import { AppCacheModule } from "./common/cache/cache.module";
import { JobsModule } from "./common/jobs/jobs.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Monorepo: DATABASE_URL vb. genelde repo kökündeki .env'de; cwd apps/backend olunca bulunmuyordu.
      envFilePath: [
        join(__dirname, "../../../.env"),
        join(__dirname, "../../.env"),
        ".env",
      ],
    }),
    ScheduleModule.forRoot(),
    PerfModule,
    AppCacheModule,
    JobsModule,
    EinvoiceModule,
    PrismaModule,
    EmailModule,
    CategoriesModule,
    NotificationsModule,
    AuthModule,
    CustomersModule,
    ProductsModule,
    ReviewsModule,
    CmsModule,
    OrdersModule,
    DiscountsModule,
    PaymentsModule,
    SettingsModule,
    ShippingModule,
    ReturnsModule,
    WhatsAppModule,
    NetgsmModule,
    AnalyticsModule,
    UploadsModule,
    MarketingModule,
    ContactModule,
  ],
})
export class AppModule {}
