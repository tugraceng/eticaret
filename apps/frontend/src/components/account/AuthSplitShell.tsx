import type { ReactNode } from "react";
import { apiAssetUrl } from "@/lib/api";

export type AuthPagePanel = {
  title?: string;
  subtitle?: string;
  imageUrl?: string | null;
  gradientFrom?: string;
  gradientTo?: string;
  textColor?: string;
};

/**
 * Giriş / kayıt: premium bölünmüş kart. Sol panel SiteSettings (`authPanel*`) ile yönetilir.
 */
export function AuthSplitShell({
  title,
  subtitle,
  siteName,
  children,
  contentAlign = "center",
  bottomAccessory = null,
  panelTitle = "Her adımda kalite.",
  panelSubtitle = "Hassas üretim ve zamansız tasarımı bir araya getiren seçkin ürünler, tek tıkla kapınızda.",
  panelImageUrl = null,
  panelGradientFrom = "#0f172a",
  panelGradientTo = "#020617",
  panelTextColor = "#ffffff",
}: {
  title: string;
  subtitle: string;
  siteName: string;
  children: ReactNode;
  contentAlign?: "center" | "start";
  bottomAccessory?: ReactNode;
  panelTitle?: string;
  panelSubtitle?: string;
  panelImageUrl?: string | null;
  panelGradientFrom?: string;
  panelGradientTo?: string;
  panelTextColor?: string;
}) {
  const compactForm = contentAlign === "start";
  const resolvedImage = apiAssetUrl(panelImageUrl) ?? panelImageUrl?.trim() ?? null;

  return (
    <div className="auth-page-root">
      <div className="auth-shell">
        <aside
          className="auth-shell-panel"
          style={{ color: panelTextColor }}
          aria-label="Marka"
        >
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `linear-gradient(155deg, ${panelGradientFrom} 0%, ${panelGradientTo} 72%)`,
            }}
            aria-hidden
          />
          {resolvedImage ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${resolvedImage.replace(/"/g, "%22")}")` }}
                aria-hidden
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/75"
                aria-hidden
              />
            </>
          ) : (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
              aria-hidden
            />
          )}
          <div
            className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:p-8 lg:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-80">{siteName}</p>
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight tracking-tight sm:text-[1.65rem]">
                {panelTitle}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-90 sm:text-[0.9375rem]">
                {panelSubtitle}
              </p>
              <ul className="mt-6 hidden gap-3 text-xs font-medium opacity-85 sm:flex sm:flex-wrap">
                <li className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  Güvenli ödeme
                </li>
                <li className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  Hızlı kargo
                </li>
                <li className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  7/24 sipariş takibi
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="auth-shell-form border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="auth-shell-form-inner">
            <header className="shrink-0">
              <p className="si-kicker lg:hidden">{siteName}</p>
              <h1 className="si-heading mt-2 text-2xl sm:text-[1.75rem]">{title}</h1>
              <p className="si-body mt-2">{subtitle}</p>
            </header>

            <div className={compactForm ? "auth-shell-form-scroll mt-5" : "mt-6 sm:mt-8"}>
              <div
                className={
                  compactForm
                    ? "pb-2"
                    : "flex min-h-[min(280px,42vh)] flex-col justify-center py-1 lg:min-h-[min(320px,50vh)]"
                }
              >
                <div className="space-y-4 sm:space-y-5">{children}</div>
              </div>
            </div>

            {bottomAccessory ? (
              <footer className="shrink-0 border-t border-white/10 pt-5 text-center text-sm text-slate-400">
                {bottomAccessory}
              </footer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
