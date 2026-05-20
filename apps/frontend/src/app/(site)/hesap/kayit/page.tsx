import type { Metadata } from "next";
import { CustomerRegisterForm } from "@/components/account/CustomerRegisterForm";
import { resolveAuthReturnTo, googleLoginEnabledFromSettings } from "@/lib/auth-return";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Kayıt" };

type SearchParams = Record<string, string | string[] | undefined>;

function pickOne(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const settings = await getSiteSettings();
  const returnTo = resolveAuthReturnTo(
    pickOne(sp.callbackUrl) ?? pickOne(sp.from),
  );

  return (
    <CustomerRegisterForm
      siteName={settings.siteName}
      returnTo={returnTo}
      googleLoginEnabled={googleLoginEnabledFromSettings(settings.googleOAuthEnabled)}
      authPanel={{
        title: settings.authPanelTitle,
        subtitle: settings.authPanelSubtitle,
        imageUrl: settings.authPanelImageUrl,
        gradientFrom: settings.authPanelGradientFrom,
        gradientTo: settings.authPanelGradientTo,
        textColor: settings.authPanelTextColor,
      }}
    />
  );
}
