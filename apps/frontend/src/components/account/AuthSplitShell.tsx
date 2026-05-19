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
  bottomAccessory?: ReactNode;
  panelTitle?: string;
  panelSubtitle?: string;
  panelImageUrl?: string | null;
  panelGradientFrom?: string;
  panelGradientTo?: string;
  panelTextColor?: string;
}) {
  const anchoredFooter = Boolean(bottomAccessory);
  const compactForm = contentAlign === "start";

  return (
    <div className="flex min-h-0 flex-col bg-white lg:min-h-[calc(100dvh-7rem)] lg:flex-row lg:items-stretch">
      {/* Sol panel — masaüstünde form ile aynı yükseklik, taşma yok */}
      <div
        className="relative isolate flex w-full shrink-0 flex-col overflow-hidden lg:flex-[0_0_38%] lg:max-w-[480px] xl:max-w-[520px] min-h-[200px] max-h-[min(36svh,280px)] lg:max-h-none lg:min-h-0"
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
            <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/30 to-black/60" aria-hidden />
          </>
        ) : null}
        <div className="relative z-10 flex flex-1 flex-col justify-end p-6 sm:p-8 lg:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75">{siteName}</p>
          <p className="mt-2 text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{panelTitle}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed opacity-90">{panelSubtitle}</p>
        </div>
      </div>

      {/* Sağ: form — kayıtta gereksiz scroll azaltılır */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 lg:border-l lg:border-t-0">
        <div
          className={`mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 ${
            compactForm ? "" : "justify-center"
          }`}
        >
          <header className="shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
          </header>

          <div
            className={`mt-5 min-h-0 flex-1 ${
              compactForm ? "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]" : ""
            }`}
          >
            <div
              className={
                contentAlign === "center" && !compactForm
                  ? "flex min-h-[min(320px,50vh)] flex-col justify-center py-2"
                  : "py-1"
              }
            >
              <div className="space-y-4 sm:space-y-5">{children}</div>
            </div>
          </div>

          {anchoredFooter ? <div className="shrink-0 pt-5">{bottomAccessory}</div> : null}
        </div>
      </div>
    </div>
  );
}
