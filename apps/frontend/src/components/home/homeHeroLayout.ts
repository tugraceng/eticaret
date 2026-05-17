/**
 * Hero çerçevesi — tam genişlik, içerik üstte sabit header altında okunur kalır.
 *
 * Önerilen kaynak görsel: **48:23** (örn. 1920×920). `cover` + üst hizalı konum:
 * üst detay korunur; hafif oran farkında kırpma alta gider.
 */

/** Yalnızca section için min-yükseklik (iç sütunda tekrarlamayın — flex-1 kullanın). */
export const heroSectionMinHeightClass =
  "max-md:min-h-[clamp(23.75rem,min(68svh,32rem),34rem)] md:min-h-[max(28.75rem,min(100svh,min(57.5rem,calc(100vw*23/48))))]";

/** İçerik alanı: üst padding güvenli alan + tipik header altı boşluk. */
export const heroContentPaddingClass =
  "px-4 pb-10 pt-[max(5rem,env(safe-area-inset-top,0px)+3.25rem)] sm:px-6 sm:pb-12 md:px-10 md:pb-16 md:pt-16 lg:px-14 xl:px-20";
