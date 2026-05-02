import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  /** TR GSM: +90 5XX XXX XX XX veya 05XX XXX XX XX */
  @IsOptional()
  @IsString()
  @Matches(/^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/, {
    message: "Telefon TR cep formatında olmalı",
  })
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsBoolean()
  kvkkAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

class ForgotDto {
  @IsEmail()
  email!: string;
}

class ResetDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** JWT geçerliliğini ve kullanıcıyı kontrol eder (panel açılmadan tek istek). */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: { sub: string; email: string; role: string } }) {
    return {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @Post("register")  register(@Body() dto: RegisterDto) {
    return this.auth.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      surname: dto.surname,
      phone: dto.phone,
      birthDate: dto.birthDate,
      kvkkAccepted: dto.kvkkAccepted,
      marketingOptIn: dto.marketingOptIn,
    });
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post("forgot-password")
  forgot(@Body() dto: ForgotDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post("reset-password")
  reset(@Body() dto: ResetDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}
