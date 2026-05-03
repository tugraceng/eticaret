import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerRegisterForm } from "@/components/account/CustomerRegisterForm";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Kayıt" };

export default async function CustomerRegisterPage() {
  const settings = await getSiteSettings();
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-8 text-center text-sm text-slate-500">Yükleniyor…</div>}>
      <CustomerRegisterForm
        siteName={settings.siteName}
        authPanel={{
          title: settings.authPanelTitle,
          subtitle: settings.authPanelSubtitle,
          imageUrl: settings.authPanelImageUrl,
          gradientFrom: settings.authPanelGradientFrom,
          gradientTo: settings.authPanelGradientTo,
          textColor: settings.authPanelTextColor,
        }}
      />
    </Suspense>
  );
}
