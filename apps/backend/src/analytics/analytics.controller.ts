import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AnalyticsService } from "./analytics.service";

class TrackDto {
  @IsString()
  event!: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("events")
  track(@Body() dto: TrackDto) {
    return this.analytics.track(dto.event, dto.path, dto.metadata);
  }

  @Get("summary")
  @UseGuards(JwtAuthGuard, AdminGuard)
  summary() {
    return this.analytics.summary();
  }

  @Get("admin/counters")
  @UseGuards(JwtAuthGuard, AdminGuard)
  counters() {
    return this.analytics.adminCounters();
  }
}
