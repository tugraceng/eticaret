import { Controller, Delete, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../guards/admin.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { PerfMetricsService } from "./perf-metrics.service";

/**
 * Admin-only canlı performans istatistikleri (in-memory).
 * - `GET  /api/internal/perf-stats`  : endpoint bazlı p50/p95/p99 + over1/5/20/100ms sayaçları
 * - `DELETE /api/internal/perf-stats`: metrikleri sıfırla (benchmark başlamadan)
 */
@Controller("internal/perf-stats")
@UseGuards(JwtAuthGuard, AdminGuard)
export class PerfController {
  constructor(private readonly metrics: PerfMetricsService) {}

  @Get()
  get() {
    return this.metrics.snapshot();
  }

  @Delete()
  reset() {
    this.metrics.reset();
    return { ok: true };
  }
}
