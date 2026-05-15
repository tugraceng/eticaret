import type { ReactNode } from "react";

export type AuthPagePanel = {
  title?: string;
  subtitle?: string;
  imageUrl?: string | null;
  gradientFrom?: string;
  gradientTo?: string;
  textColor?: string;
};

/**
 * Giriş / kayıt: bölünmüş yerleşim. Sol panel metinleri / arka planı SiteSettings
 * (`authPanel*`) üzerinden yönetilebilir.
 */
export function AuthSplitShell({
  title,
  subtitle,
  siteName,
  children,
  contentAlign = "center",
  panelTitle = "Her adımda kalite.",
  panelSubtitle = "Hassas üretim ve zamansız tasarımı bir araya getiren seçkin ürünler, tek tıkla kapınızda.",
  panelImageUrl = null,
  panelGradientFrom = "#334155",
  panelGradientTo = "#020617",
  panelTextColor = "#ffffff",
}: {
  title: string;
  subtitle: string;
  siteName: string;
  children: ReactNode;
  contentAlign?: "center" | "start";
  panelTitle?: string;
  panelSubtitle?: string;
  panelImageUrl?: string | null;
  panelGradientFrom?: string;
  panelGradientTo?: string;
  panelTextColor?: string;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col bg-white md:min-h-[calc(100dvh-6rem)] lg:flex-row">
      <div
        className="relative h-[min(32svh,280px)] w-full flex-shrink-0 overflow-hidden sm:h-[min(34svh,300px)] lg:h-auto lg:min-h-0 lg:flex-[0_0_38%]"
        style={{ color: panelTextColor }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${panelGradientFrom} 0%, ${panelGradientTo} 100%)`,
          }}
          aria-hidden
        />
        {panelImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-55"
              style={{ backgroundImage: `url(${panelImageUrl})` }}
              role="img"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" aria-hidden />
          </>
        ) : null}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12' /%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative z-10 flex h-full min-h-0 flex-col justify-center px-6 py-8 max-lg:pb-10 md:p-10 lg:justify-end lg:pb-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{siteName}</p>
          <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{panelTitle}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-90 [text-wrap:pretty]">
            {panelSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div
          className={`flex flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-10 md:px-12 lg:px-16 ${
            contentAlign === "start" ? "justify-start" : "justify-center"
          }`}
        >
          <div className="mx-auto w-full max-w-md py-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
