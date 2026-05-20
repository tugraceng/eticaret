/**
 * StoneIron cinematic hero — mobile-first, desktop split (metin sol / ürün sağ).
 * Yükseklik: tam ekran değil; içerik + görsel dengeli (mockup).
 */

/** Mobil ~70svh cap; masaüstü ~38–44rem — 92svh kaldırıldı */
export const heroSectionMinHeightClass =
  "min-h-[min(30rem,72svh)] sm:min-h-[min(32rem,74svh)] md:min-h-[34rem] lg:min-h-[38rem] xl:min-h-[42rem]";

export const heroContentPaddingClass =
  "px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16";

/** Fixed header altında metin; mobilde alt bant */
export const heroContentLayoutClass =
  "flex w-full flex-1 flex-col justify-end pb-8 pt-[max(4.75rem,env(safe-area-inset-top,0px)+3.25rem)] sm:pb-10 sm:pt-[max(5rem,env(safe-area-inset-top,0px)+3.5rem)] lg:max-w-[min(100%,32rem)] lg:justify-center lg:pb-14 lg:pt-28 xl:max-w-[34rem]";

export const heroGridClass =
  "relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-6 xl:gap-10";

/** Görsel paneli — masaüstünde sağ yarı */
export const heroVisualPanelClass =
  "pointer-events-none absolute inset-0 lg:absolute lg:inset-y-0 lg:left-[40%] lg:right-0";
