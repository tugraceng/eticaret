/**
 * Hero — kompakt first-fold, sol metin / sağ ürün, premium collectible vitrin.
 */

export const heroSectionMinHeightClass =
  "min-h-[min(26rem,76svh)] sm:min-h-[28rem] lg:min-h-[min(34rem,88svh)] lg:max-h-[42rem]";

export const heroContentPaddingClass = "px-4 sm:px-6 lg:px-8";

export const heroContentLayoutClass =
  "flex w-full flex-col justify-end pb-6 pt-[max(4.75rem,env(safe-area-inset-top,0px)+3.25rem)] sm:pb-7 lg:max-w-[26rem] lg:justify-center lg:py-8 xl:max-w-[28rem]";

export const heroGridClass =
  "relative z-10 mx-auto grid h-full w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-center lg:gap-8 xl:gap-12";

/** Mobil: alt yarı; masaüstü: sağ panel — ürün önde */
export const heroVisualPanelClass =
  "pointer-events-none absolute inset-x-0 bottom-0 top-[36%] z-[1] sm:top-[30%] lg:inset-y-0 lg:left-[38%] lg:right-0 lg:top-0";
