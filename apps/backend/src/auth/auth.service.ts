import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import type { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import type { JwtPayload } from "./jwt.strategy";

type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  phone?: string;
  birthDate?: string;
  kvkkAccepted?: boolean;
  marketingOptIn?: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    if (!input.kvkkAccepted) {
      throw new BadRequestException("KVKK aydınlatma metnini onaylamanız gerekir.");
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Bu e-posta zaten kayıtlı.");

    const passwordHash = await bcrypt.hash(input.password, 12);

    let birthDate: Date | null = null;
    if (input.birthDate) {
      const d = new Date(input.birthDate);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException("Doğum tarihi geçersiz.");
      }
      const today = new Date();
      const age = today.getFullYear() - d.getFullYear() - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
      if (age < 18) {
        throw new BadRequestException("En az 18 yaşında olmalısınız.");
      }
      if (age > 120) {
        throw new BadRequestException("Doğum tarihi geçersiz.");
      }
      birthDate = d;
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name?.trim() || null,
        surname: input.surname?.trim() || null,
        phone: input.phone?.trim() || null,
        birthDate,
        kvkkAcceptedAt: new Date(),
        marketingOptIn: !!input.marketingOptIn,
        role: "CUSTOMER",
        customer: {
          create: {
            email,
            name: input.name?.trim() || null,
            surname: input.surname?.trim() || null,
            phone: input.phone?.trim() || null,
          },
        },
      },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken: this.sign(user) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    const safe = { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };
    return {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken: this.sign(safe),
    };
  }

  /** Google OAuth: yalnızca aynı e-posta ile kayıtlı müşteri hesapları. */
  async findCustomerForGoogleOAuth(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    if (!user) {
      throw new UnauthorizedException(
        "Bu Google hesabının e-postası mağazada kayıtlı değil. Önce kayıt olun, ardından Google ile giriş yapın.",
      );
    }
    if (user.role !== "CUSTOMER") {
      throw new UnauthorizedException("Bu giriş yalnızca mağaza müşteri hesapları içindir.");
    }
    return user;
  }

  issueAccessTokenForUser(user: { id: string; email: string; role: UserRole; tokenVersion: number }) {
    return this.sign(user);
  }

  async forgotPassword(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { ok: true };
    }
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    const base = process.env.PUBLIC_WEB_URL ?? "http://localhost:3001";
    const resetUrl = `${base}/hesap/sifre-sifirla?token=${token}`;
    this.email.passwordReset({ email, resetUrl });
    const debug = process.env.NODE_ENV !== "production";
    return debug ? { ok: true, devResetUrl: resetUrl } : { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || newPassword.length < 8) {
      throw new BadRequestException("Geçersiz istek.");
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const row = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException("Bağlantı geçersiz veya süresi dolmuş.");
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      // Aynı kullanıcı için bekleyen diğer reset tokenlarını da iptal et
      this.prisma.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  private sign(user: { id: string; email: string; role: UserRole; tokenVersion?: number }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    };
    return this.jwt.sign(payload);
  }
}
