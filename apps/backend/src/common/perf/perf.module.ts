import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PerfController } from "./perf.controller";
import { PerfInterceptor } from "./perf.interceptor";
import { PerfMetricsService } from "./perf-metrics.service";

@Global()
@Module({
  controllers: [PerfController],
  providers: [
    PerfMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerfInterceptor,
    },
  ],
  exports: [PerfMetricsService],
})
export class PerfModule {}
