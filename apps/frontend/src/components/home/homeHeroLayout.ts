/**
 * Hero — kompakt, görsel odaklı; gereksiz metin yok.
 */

export const heroSectionMinHeightClass =
  "min-h-[min(24rem,68svh)] sm:min-h-[26rem] md:min-h-[28rem] lg:min-h-[30rem] xl:min-h-[32rem]";

export const heroContentPaddingClass = "px-4 sm:px-6 lg:px-8";

export const heroContentLayoutClass =
  "flex w-full flex-col justify-end pb-8 pt-[max(4.5rem,env(safe-area-inset-top,0px)+3rem)] sm:pb-10 lg:max-w-xl lg:justify-center lg:py-12";

export const heroGridClass =
  "relative z-10 mx-auto flex h-full w-full max-w-7xl flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-0";

/** Tam genişlik mobil; masaüstünde sağ yarı */
export const heroVisualPanelClass =
  "pointer-events-none absolute inset-0 lg:left-1/2 lg:right-0";
