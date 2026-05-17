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
 * Giriş / kayıt: bölünmüş yerleşim. Sol panel SiteSettings (`authPanel*`) ile yönetilir.
 * `bottomAccessory` verildiğinde (ör. «Zaten hesabınız var mı») masaüstünde sol panel metni alta alınır
 * ve sağdaki sabit alt satır ile aynı şeritte hizalanır.
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
  panelGradientFrom = "#334155",
  panelGradientTo = "#020617",
  panelTextColor = "#ffffff",
}: {
  title: string;
  subtitle: string;
  siteName: string;
  children: ReactNode;
  contentAlign?: "center" | "start";
  /** Form altı bağlantı satırı — masaüstünde sol panel sloganı ile alt hizada */
  bottomAccessory?: ReactNode;
  panelTitle?: string;
  panelSubtitle?: string;
  panelImageUrl?: string | null;
  panelGradientFrom?: string;
  panelGradientTo?: string;
  panelTextColor?: string;
}) {
  const anchoredFooter = Boolean(bottomAccessory);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col bg-white md:min-h-[calc(100dvh-6rem)] lg:flex-row lg:items-stretch">
      {/* Sol panel: görsel tam alan + metin ortada */}
      <div
        className="relative isolate flex w-full flex-shrink-0 flex-col overflow-hidden min-h-[min(42svh,300px)] max-h-[420px] sm:min-h-[min(40svh,320px)] sm:max-h-[440px] lg:max-h-none lg:min-h-0 lg:flex-[0_0_40%] lg:max-w-[520px] xl:max-w-none"
        style={{ color: panelTextColor }}
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(145deg, ${panelGradientFrom} 0%, ${panelGradientTo} 100%)`,
          }}
          aria-hidden
        />
        {panelImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${panelImageUrl})` }}
              aria-hidden
            />
            {/* Okunabilirlik: marka gradient + hafif karartma */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/25 to-black/55"
              aria-hidden
            />
            <div
              className="absolute inset-0 opacity-[0.35] mix-blend-multiply"
              style={{
                background: `linear-gradient(165deg, ${panelGradientFrom}cc 0%, transparent 45%, ${panelGradientTo}99 100%)`,
              }}
              aria-hidden
            />
          </>
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12' /%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div
          className={`relative z-10 flex flex-1 flex-col px-6 py-10 sm:px-8 sm:py-12 lg:px-10 xl:px-12 ${
            anchoredFooter
              ? "justify-center lg:justify-end lg:pt-14 lg:pb-12"
              : "justify-center lg:py-14"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75">{siteName}</p>
          <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{panelTitle}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-95 [text-wrap:pretty] lg:max-w-sm">
            {panelSubtitle}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 lg:border-l lg:border-t-0">
        {anchoredFooter ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-8 sm:px-10 sm:py-10 md:px-12 lg:px-16 lg:py-12">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col py-1">
              <header className="shrink-0">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
                <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
              </header>
              <div className="mt-6 flex min-h-0 flex-1 flex-col sm:mt-8">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                  <div
                    className={
                      contentAlign === "center"
                        ? "flex min-h-full flex-col justify-center pb-4"
                        : "pb-4"
                    }
                  >
                    <div className="space-y-5 sm:space-y-6">{children}</div>
                  </div>
                </div>
                <div className="shrink-0 pt-6 lg:pt-7">{bottomAccessory}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-10 sm:py-10 md:px-12 lg:px-16 lg:py-12 ${
              contentAlign === "start" ? "justify-start" : "justify-center"
            }`}
          >
            <div className="mx-auto w-full max-w-md py-1">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
              <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">{children}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
