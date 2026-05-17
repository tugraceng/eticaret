/**
 * Hero çerçevesi — tam genişlik.
 *
 * Önerilen kaynak görsel: **48:23** (örn. 1920×920). Masaüstü: `cover` + üst hizalı.
 */

/** Yalnızca section için min-yükseklik (iç sütunda tekrarlamayın — flex-1 kullanın). */
export const heroSectionMinHeightClass =
  "max-md:min-h-[clamp(24rem,min(72svh,36rem),38rem)] md:min-h-[max(28.75rem,min(92svh,min(57.5rem,calc(100vw*23/48))))]";

/** Yatay padding — iç sütun için */
export const heroContentPaddingClass = "px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20";

/**
 * Dikey yerleşim: metin ve CTA alt banda — mobilde güvenli alt boşluk, masaüstünde geniş alt padding.
 */
export const heroContentLayoutClass =
  "flex w-full flex-1 flex-col justify-end pb-14 pt-[max(3.5rem,env(safe-area-inset-top,0px)+2.25rem)] max-md:pb-[max(3.75rem,env(safe-area-inset-bottom,0px)+1.25rem)] md:pb-[clamp(5.5rem,11svh,9rem)] md:pt-[max(5rem,env(safe-area-inset-top,0px)+3.25rem)] lg:pb-[clamp(6rem,12svh,10rem)] lg:pt-36";
