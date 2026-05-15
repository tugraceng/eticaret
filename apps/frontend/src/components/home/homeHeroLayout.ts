/**
 * Hero çerçevesi: tam genişlik × yükseklik (aşağıdaki sınıflar).
 * Tipik masaüstü (ör. 1920px genişlik, 920px yükseklik) → **48:23** (~2,087:1).
 *
 * **Önerilen kaynak görsel (kenardan kenara, kırpma yok):**
 * - **3840 × 1840** (2×), **2400 × 1150**, **1920 × 920** — hepsi ≈ 48:23.
 * - Photoshop / Figma sanat tahtası: en **48**, boy **23** birim.
 *
 * 16:9 veya 2560×1080 (≈21:9) kullanırsanız çerçeveden farklı oldukları için
 * `cover` ile hafif kırpma veya `contain` ile şerit kaçınılmaz; kritik konuyu
 * görselin **orta–sağ** bölgesinde tutun (site metni solda).
 *
 * Mobil: yükseklik `clamp` ile 48:23 oranına yaklaştırılır (tam ekran şişmesi yok);
 * arka planda `contain` ile görselin tamamı görünür.
 */

/** Bölüm + iç sütun için aynı min-yükseklik (Tailwind). */
export const heroSectionMinHeightClass =
  "max-md:min-h-[clamp(340px,calc(100vw*23/48),min(82svh,620px))] md:min-h-[max(440px,min(100svh,min(920px,calc(100vw*23/48))))]";
