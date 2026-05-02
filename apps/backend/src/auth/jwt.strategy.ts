import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tv?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly prisma: PrismaService,
    cfg: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.get<string>("JWT_SECRET") ?? process.env.JWT_SECRET ?? "dev-insecure-secret",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    if (!user) throw new UnauthorizedException();
    /** JWT bazen claim’i sayı yerine dizge taşıyabiliyor; katı karşılaştırma geçersiz oturumu tetikliyor */
    const tv = Number(payload.tv ?? 0);
    const dbTv = Number(user.tokenVersion ?? 0);
    if (!Number.isFinite(tv) || !Number.isFinite(dbTv)) {
      throw new UnauthorizedException("Oturum geçersiz, lütfen yeniden giriş yapın.");
    }
    if (tv !== dbTv) {
      throw new UnauthorizedException("Oturum sonlandırıldı, lütfen yeniden giriş yapın.");
    }
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
