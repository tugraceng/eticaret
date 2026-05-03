import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  constructor(private readonly cfg: ConfigService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const base = this.cfg.get<string>("PUBLIC_WEB_URL") ?? "http://localhost:3000";
    return {
      session: false,
      failureRedirect: `${base}/hesap/giris?oauth_error=1`,
      scope: ["email", "profile"],
    };
  }
}
