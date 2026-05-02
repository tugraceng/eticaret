import { AnalyticsBeacon } from "@/components/site/AnalyticsBeacon";
import { CookieConsent } from "@/components/site/CookieConsent";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteMobileDock } from "@/components/site/SiteMobileDock";
import { SitePromoPopup } from "@/components/site/SitePromoPopup";
import { SiteUiChrome } from "@/components/site/SiteUiChrome";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { apiJsonSafe } from "@/lib/api";
import { buildHeaderCategoryNav, type CategoryApiRow } from "@/lib/category-nav";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categoryRows] = await Promise.all([
    getSiteSettings(),
    apiJsonSafe<CategoryApiRow[]>("/categories"),
  ]);
  const categoryNav = categoryRows ? buildHeaderCategoryNav(categoryRows) : [];

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <AnalyticsBeacon />
      <SiteHeader settings={settings} categoryNav={categoryNav} />
      <div className="flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <SiteFooter settings={settings} />
      <SiteMobileDock categoryNav={categoryNav} />
      <SiteUiChrome />
      <SitePromoPopup
        settingsId={settings.id}
        enabled={Boolean(settings.popupEnabled)}
        title={settings.popupTitle ?? null}
        body={settings.popupBody ?? null}
        ctaLabel={settings.popupCtaLabel ?? null}
        ctaHref={settings.popupCtaHref ?? null}
        imageUrl={settings.popupImageUrl ?? null}
        size={settings.popupSize ?? "md"}
        dismissBackdrop={settings.popupDismissBackdrop !== false}
        sessionOnly={Boolean(settings.popupSessionOnly)}
        storageKey={settings.popupStorageKey ?? "1"}
      />
      {settings.whatsappEnabled && settings.whatsappNumber && (
        <WhatsAppFAB
          number={settings.whatsappNumber}
          greeting={settings.whatsappGreeting}
        />
      )}
      <CookieConsent />
    </div>
  );
}
