import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import type { SignOptions } from "jsonwebtoken";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { GoogleAuthController } from "./google-auth.controller";
import { GoogleOAuthGuard } from "./google-oauth.guard";
import { GoogleStrategy } from "./google.strategy";
import { JwtStrategy } from "./jwt.strategy";

const googleOAuthEnabled =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !!process.env.GOOGLE_CALLBACK_URL;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret =
          cfg.get<string>("JWT_SECRET") ?? process.env.JWT_SECRET ?? "dev-insecure-secret";
        const expires = (cfg.get<string>("JWT_EXPIRES_IN") ??
          process.env.JWT_EXPIRES_IN ??
          "7d") as SignOptions["expiresIn"];
        return {
          secret,
          signOptions: { expiresIn: expires },
        };
      },
    }),
  ],
  controllers: [AuthController, ...(googleOAuthEnabled ? [GoogleAuthController] : [])],
  providers: [
    AuthService,
    JwtStrategy,
    ...(googleOAuthEnabled ? [GoogleStrategy, GoogleOAuthGuard] : []),
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
