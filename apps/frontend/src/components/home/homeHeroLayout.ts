/**
 * StoneIron cinematic hero — mobile-first, desktop split (metin sol / ürün sağ).
 */

export const heroSectionMinHeightClass =
  "min-h-[clamp(20rem,min(68svh,32rem),36rem)] md:min-h-[clamp(28rem,min(88svh,44rem),52rem)] lg:min-h-[min(92svh,44rem)]";

export const heroContentPaddingClass =
  "px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16";

/** Masaüstünde dikey orta; mobilde alt bant */
export const heroContentLayoutClass =
  "flex w-full flex-1 flex-col justify-end pb-10 pt-[max(5.5rem,env(safe-area-inset-top,0px)+3.5rem)] max-md:pb-12 lg:max-w-[min(100%,34rem)] lg:justify-center lg:pb-16 lg:pt-24";

export const heroGridClass =
  "relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 xl:gap-12";

/** Görsel paneli — masaüstünde sağ yarı */
export const heroVisualPanelClass =
  "pointer-events-none absolute inset-0 lg:absolute lg:inset-y-0 lg:left-[38%] lg:right-0";
