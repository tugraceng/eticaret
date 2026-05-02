import type { Metadata } from "next";
import { CustomerLoginForm } from "@/components/account/CustomerLoginForm";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Giriş" };

export default async function CustomerLoginPage() {
  const s = await getSiteSettings();
  return (
    <CustomerLoginForm
      siteName={s.siteName}
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
