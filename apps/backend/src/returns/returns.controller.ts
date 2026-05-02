import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ReturnsService } from "./returns.service";

class ReturnItemDto {
  @IsString()
  orderItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateReturnDto {
  @IsString()
  orderId!: string;

  @IsString()
  @MinLength(4)
  reason!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items!: ReturnItemDto[];
}

class DecideReturnDto {
  @IsEnum(["APPROVED", "REJECTED", "COMPLETED"] as const)
  decision!: "APPROVED" | "REJECTED" | "COMPLETED";

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  restock?: boolean;
}

type ReqUser = { user?: { sub: string; role: "ADMIN" | "CUSTOMER" } };

@Controller()
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("returns")
  create(@Body() dto: CreateReturnDto, @Req() req: ReqUser) {
    return this.service.create({
      orderId: dto.orderId,
      reason: dto.reason,
      items: dto.items,
      userId: req.user?.sub,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("returns/mine")
  mine(@Req() req: ReqUser) {
    if (!req.user) return [];
    return this.service.listMine(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/returns")
  listAdmin(@Query("filter") filter?: string) {
    const valid = ["all", "pending", "decided"] as const;
    const f = (valid as readonly string[]).includes(filter ?? "")
      ? (filter as (typeof valid)[number])
      : "all";
    return this.service.listAdmin(f);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch("admin/returns/:id")
  decide(@Param("id") id: string, @Body() dto: DecideReturnDto, @Req() req: ReqUser) {
    return this.service.decide(id, dto.decision, {
      adminId: req.user!.sub,
      note: dto.note,
      restock: dto.restock,
    });
  }
}
