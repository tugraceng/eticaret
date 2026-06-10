/** Premium hero — mobilde tam ekran overlay, masaüstünde split layout */

export const heroV2SectionClass =
  "si-hero-v2 relative w-full overflow-hidden bg-[#0a0c10] pt-[var(--si-site-header-h,4.5rem)]";

export const heroV2InnerClass =
  "si-hero-v2__inner relative mx-auto w-full min-w-0 max-w-7xl min-h-[calc(100dvh-var(--si-site-header-h,4.5rem))] lg:grid lg:grid-cols-2 lg:items-stretch";

/** Mobil: arka plan katmanı · Desktop: sağ sütun */
export const heroV2VisualClass =
  "si-hero-v2__visual absolute inset-0 overflow-hidden lg:relative lg:order-2 lg:h-full lg:min-h-[calc(100dvh-var(--si-site-header-h,4.5rem))]";

/** Mobil: metin görsel üzerinde altta · Desktop: sol sütun ortalı */
export const heroV2ContentClass =
  "si-hero-v2__content relative z-10 flex min-h-[calc(100dvh-var(--si-site-header-h,4.5rem))] w-full min-w-0 flex-col justify-end px-4 pb-7 pt-4 sm:px-6 sm:pb-8 lg:order-1 lg:min-h-0 lg:justify-center lg:bg-[#0a0c10] lg:px-10 lg:py-8 xl:px-14";
