import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MarketingService } from "./marketing.service";

@Injectable()
export class MarketingCronService {
  private readonly log = new Logger(MarketingCronService.name);

  constructor(private readonly marketing: MarketingService) {}

  /** Her gün 08:00 (sunucu saati). Ayar kapalıysa servis atlar. */
  @Cron("0 8 * * *")
  async dailyBirthdayAutomation() {
    try {
      const r = await this.marketing.runBirthdayAutomation();
      if (r && typeof r === "object" && "skipped" in r && (r as { skipped?: boolean }).skipped) {
        this.log.log(`Doğum günü cron: ${(r as { message?: string }).message ?? "atlandı"}`);
        return;
      }
      this.log.log(`Doğum günü cron: ${JSON.stringify(r)}`);
    } catch (e) {
      this.log.warn(`Doğum günü cron hata: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
