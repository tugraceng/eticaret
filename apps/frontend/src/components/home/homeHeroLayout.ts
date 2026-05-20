/**
 * Hero — header altından başlar, görsel tam panel, metin solda.
 * Yükseklik: --si-site-header-h (SiteHeader ResizeObserver ile set edilir).
 */

/** Görsel + metin toplam yükseklik (header hariç alan dahil) */
export const heroSectionMinHeightClass =
  "min-h-[max(34rem,calc(var(--si-site-header-h,9.5rem)+26rem))] sm:min-h-[max(38rem,calc(var(--si-site-header-h,10rem)+28rem))] lg:min-h-[max(42rem,calc(var(--si-site-header-h,11rem)+30rem))] xl:min-h-[max(46rem,calc(var(--si-site-header-h,11rem)+32rem))]";

/** Görsel header çizgisinin altından footer’a kadar */
export const heroVisualPanelClass = "si-hero-visual pointer-events-none absolute inset-x-0 bottom-0 z-[1]";

/** Metin katmanı — header yüksekliği kadar üst boşluk */
export const heroContentShellClass =
  "si-hero-shell relative z-10 flex min-h-[inherit] flex-1 flex-col";

export const heroContentPaddingClass = "px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12";

export const heroContentLayoutClass =
  "flex w-full flex-col justify-end pb-2 pt-4 sm:pt-6 lg:max-w-[32rem] lg:justify-center lg:py-6 xl:max-w-[34rem]";

export const heroGridClass =
  "mx-auto grid h-full w-full max-w-7xl flex-1 grid-cols-1 content-end lg:content-center lg:grid-cols-[minmax(0,38%)_1fr] lg:items-center lg:gap-8 xl:gap-12";
