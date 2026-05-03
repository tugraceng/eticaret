import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { GoogleOAuthGuard } from "./google-oauth.guard";

type GoogleUser = { id: string; email: string; role: UserRole; tokenVersion: number };

@Controller("auth")
export class GoogleAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {}

  @Get("oauth/google")
  @UseGuards(GoogleOAuthGuard)
  oauthGoogle() {
    /* Passport yönlendirir */
  }

  @Get("oauth/google/callback")
  @UseGuards(GoogleOAuthGuard)
  oauthGoogleCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ) {
    const u = req.user as GoogleUser;

    const token = this.auth.issueAccessTokenForUser(u);
    const base = this.cfg.get<string>("PUBLIC_WEB_URL") ?? "http://localhost:3000";
    const frag = `#access_token=${encodeURIComponent(token)}`;
    res.redirect(302, `${base}/hesap/giris${frag}`);
  }
}
