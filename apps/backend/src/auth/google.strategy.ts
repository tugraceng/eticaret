import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { AuthService } from "./auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    cfg: ConfigService,
    private readonly auth: AuthService,
  ) {
    const clientID = cfg.getOrThrow<string>("GOOGLE_CLIENT_ID");
    const clientSecret = cfg.getOrThrow<string>("GOOGLE_CLIENT_SECRET");
    const callbackURL = cfg.getOrThrow<string>("GOOGLE_CALLBACK_URL");
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException("Google profilinden e-posta alınamadı.");
    }
    return this.auth.findCustomerForGoogleOAuth(email);
  }
}
