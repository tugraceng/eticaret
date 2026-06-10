import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import type { Request, Response } from "express";
import { PaymentProvider } from "@prisma/client";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PaymentsService } from "./payments.service";

class MockPayDto {
  @IsString()
  orderId!: string;
}

class UpsertProviderDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @IsOptional()
  @IsString()
  apiKey?: string | null;

  @IsOptional()
  @IsString()
  secretKey?: string | null;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown> | null;
}

class TestProviderDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}

class StartIyzicoDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  draftId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  identityNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // Public list (name/id/enabled/ready/sandbox)
  @Get("providers")
  providers() {
    return this.payments.listProvidersPublic();
  }

  // Admin-only detailed config (masked secret)
  @Get("providers/:provider")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getProviderConfig(
    @Param("provider", new ParseEnumPipe(PaymentProvider))
    provider: PaymentProvider,
  ) {
    return this.payments.getProviderConfig(provider);
  }

  @Patch("providers/:provider")
  @UseGuards(JwtAuthGuard, AdminGuard)
  upsertProviderConfig(
    @Param("provider", new ParseEnumPipe(PaymentProvider))
    provider: PaymentProvider,
    @Body() dto: UpsertProviderDto,
  ) {
    return this.payments.upsertProviderConfig(provider, dto);
  }

  @Post("providers/iyzico/test")
  @UseGuards(JwtAuthGuard, AdminGuard)
  testIyzico(@Body() dto: TestProviderDto) {
    return this.payments.testIyzico(dto);
  }

  // Start iyzico Checkout Form flow for an existing PENDING order
  @Post("iyzico/start")
  async startIyzico(@Body() dto: StartIyzicoDto, @Req() req: Request) {
    const apiOrigin = `${req.protocol}://${req.get("host")}`;
    const origin = (req.headers.origin as string | undefined) ?? undefined;
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.ip ||
      undefined;
    const result = await this.payments.startIyzicoCheckout({
      orderId: dto.orderId,
      draftId: dto.draftId,
      origin,
      apiOrigin,
      buyer: {
        name: dto.name,
        surname: dto.surname,
        email: dto.email,
        phone: dto.phone,
        identityNumber: dto.identityNumber,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        ip,
      },
    });
    return result;
  }

  // iyzico posts application/x-www-form-urlencoded { token, ... } here when the user returns.
  @Post("iyzico/callback")
  async iyzicoCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const body = (req.body ?? {}) as Record<string, string>;
    const token = (body.token as string) || (req.query.token as string) || "";
    const origin = (req.headers.origin as string | undefined) ?? undefined;
    const { redirectUrl } = await this.payments.handleIyzicoCallback({ token, origin });
    res.redirect(302, redirectUrl);
  }

  // Legacy
  @Post("mock-checkout")
  mock(@Body() dto: MockPayDto) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Mock ödeme üretim ortamında kullanılamaz.");
    }
    return this.payments.mockCheckout(dto.orderId);
  }
}
