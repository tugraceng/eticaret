/**
 * Hero — ortalanmış 16:9 (1920×1080) kaydırmalı vitrin.
 * Header yüksekliği --si-site-header-h ile telafi edilir.
 */

/** Bölüm: header altı boşluk + alt padding */
export const heroCarouselSectionClass =
  "si-hero si-hero-carousel relative isolate w-full bg-[#0c0e12] pt-[var(--si-site-header-h,9.5rem)] pb-6 sm:pb-8 lg:pb-10";

/** Maks. 1920px genişlik, yatay ortalama */
export const heroCarouselOuterClass = "mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8";

/** 16:9 slayt çerçevesi — görsel tam doldurmaz, kutu içinde kalır */
export const heroCarouselFrameClass =
  "si-hero-carousel-frame relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] sm:rounded-2xl";

/** Metin katmanı — slayt üzerinde sol alt / masaüstünde sol orta */
export const heroCarouselContentClass =
  "pointer-events-none absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-7 lg:max-w-[46%] lg:justify-center lg:p-10 xl:p-12";

/** @deprecated Tam genişlik hero — HomeHeroCarouselView kullanın */
export const heroSectionMinHeightClass =
  "min-h-[max(26rem,calc(var(--si-site-header-h,9.5rem)+18rem))] sm:min-h-[max(32rem,calc(var(--si-site-header-h,10rem)+22rem))] lg:min-h-[max(38rem,calc(var(--si-site-header-h,11rem)+26rem))] xl:min-h-[max(42rem,calc(var(--si-site-header-h,11rem)+28rem))]";

/** @deprecated */
export const heroVisualPanelClass = "si-hero-visual pointer-events-none absolute inset-x-0 bottom-0 z-[1]";

/** @deprecated */
export const heroContentShellClass =
  "si-hero-shell relative z-10 flex min-h-[inherit] flex-1 flex-col";

/** @deprecated */
export const heroContentPaddingClass = "px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12";

/** @deprecated */
export const heroContentLayoutClass =
  "flex w-full flex-col justify-end pb-2 pt-4 sm:pt-6 lg:max-w-[32rem] lg:justify-center lg:py-6 xl:max-w-[34rem]";

/** @deprecated */
export const heroGridClass =
  "mx-auto grid h-full w-full max-w-7xl flex-1 grid-cols-1 content-end lg:content-center lg:grid-cols-[minmax(0,38%)_1fr] lg:items-center lg:gap-8 xl:gap-12";
