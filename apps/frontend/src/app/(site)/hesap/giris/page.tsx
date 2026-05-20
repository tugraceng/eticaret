import type { Metadata } from "next";
import { CustomerLoginForm } from "@/components/account/CustomerLoginForm";
import { resolveAuthReturnTo, googleLoginEnabledFromSettings } from "@/lib/auth-return";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Giriş" };

type SearchParams = Record<string, string | string[] | undefined>;

function pickOne(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const s = await getSiteSettings();
  const returnTo = resolveAuthReturnTo(
    pickOne(sp.callbackUrl) ?? pickOne(sp.from),
  );
  const oauthError = pickOne(sp.oauth_error);

  return (
    <CustomerLoginForm
      siteName={s.siteName}
      returnTo={returnTo}
      initialOauthError={oauthError}
      googleLoginEnabled={googleLoginEnabledFromSettings(s.googleOAuthEnabled)}
      authPanel={{
        title: s.authPanelTitle,
        subtitle: s.authPanelSubtitle,
        imageUrl: s.authPanelImageUrl,
        gradientFrom: s.authPanelGradientFrom,
        gradientTo: s.authPanelGradientTo,
        textColor: s.authPanelTextColor,
      }}
    />
  );
}
