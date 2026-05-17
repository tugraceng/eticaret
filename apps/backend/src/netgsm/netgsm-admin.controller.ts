import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { TestNetgsmSmsDto } from "./dto/test-netgsm-sms.dto";
import { NetgsmService } from "./netgsm.service";

@Controller("admin/netgsm")
@UseGuards(JwtAuthGuard, AdminGuard)
export class NetgsmAdminController {
  constructor(private readonly netgsm: NetgsmService) {}

  @Post("test-sms")
  async testSms(@Body() dto: TestNetgsmSmsDto) {
    const msg = dto.message?.trim() || "Bu bir test SMSidir.";
    const r = await this.netgsm.sendSms({
      toRaw: dto.phone,
      message: msg,
      filter: "0",
      log: { purpose: "TEST" },
    });
    if (!r.ok) {
      throw new BadRequestException(r.detail ?? r.code ?? "SMS gönderilemedi");
    }
    return { ok: true, code: r.code, detail: r.detail };
  }

  @Get("logs")
  listLogs(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("purpose") purpose?: string,
  ) {
    const lim = Number.parseInt(limit ?? "50", 10);
    const off = Number.parseInt(offset ?? "0", 10);
    return this.netgsm.listLogs({
      limit: Number.isFinite(lim) ? lim : 50,
      offset: Number.isFinite(off) ? off : 0,
      purpose: purpose?.trim() || undefined,
    });
  }
}
