/** Hero slayt görsel gösterim ayarları (admin → config.slides[]). */

export const HERO_IMAGE_FITS = ["cover", "contain", "contain_blur"] as const;
export type HeroImageFit = (typeof HERO_IMAGE_FITS)[number];

export const HERO_IMAGE_POSITIONS = [
  "center center",
  "top center",
  "bottom center",
  "left center",
  "right center",
] as const;
export type HeroImagePosition = (typeof HERO_IMAGE_POSITIONS)[number];

export type HeroImageDisplay = {
  imageFit: HeroImageFit;
  imagePosition: HeroImagePosition;
  imagePositionMobile: HeroImagePosition | null;
};

export const DEFAULT_HERO_IMAGE_DISPLAY: HeroImageDisplay = {
  imageFit: "cover",
  imagePosition: "center center",
  imagePositionMobile: null,
};

const FIT_SET = new Set<string>(HERO_IMAGE_FITS);
const POS_SET = new Set<string>(HERO_IMAGE_POSITIONS);

export function parseHeroImageFit(raw: unknown): HeroImageFit {
  if (typeof raw === "string" && FIT_SET.has(raw)) return raw as HeroImageFit;
  return DEFAULT_HERO_IMAGE_DISPLAY.imageFit;
}

export function parseHeroImagePosition(raw: unknown): HeroImagePosition {
  if (typeof raw === "string" && POS_SET.has(raw)) return raw as HeroImagePosition;
  return DEFAULT_HERO_IMAGE_DISPLAY.imagePosition;
}

export function parseHeroImageDisplay(o: Record<string, unknown> | null | undefined): HeroImageDisplay {
  if (!o) return { ...DEFAULT_HERO_IMAGE_DISPLAY };
  const mobileRaw = o.image_position_mobile ?? o.imagePositionMobile;
  const mobile =
    typeof mobileRaw === "string" && POS_SET.has(mobileRaw) ? (mobileRaw as HeroImagePosition) : null;
  return {
    imageFit: parseHeroImageFit(o.image_fit ?? o.imageFit),
    imagePosition: parseHeroImagePosition(o.image_position ?? o.imagePosition),
    imagePositionMobile: mobile,
  };
}

/**
 * Tailwind arbitrary object-position sınıfları build’de üretilmediği için
 * masaüstünde konum uygulanmıyordu — CSS değişkenleri kullanın (hero-image-position-host).
 */
export function heroImagePositionVars(
  desktop: HeroImagePosition,
  mobile: HeroImagePosition | null,
): Record<string, string> {
  const m = mobile ?? desktop;
  return {
    "--hero-object-position": desktop,
    "--hero-object-position-mobile": m,
  };
}

/** @deprecated heroImagePositionVars + .hero-image-position-host kullanın */
export function heroObjectPositionClass(
  desktop: HeroImagePosition,
  mobile: HeroImagePosition | null,
): string {
  void desktop;
  void mobile;
  return "hero-image-position-host";
}

export const HERO_IMAGE_FIT_LABELS: Record<HeroImageFit, string> = {
  cover: "Kapla (alanı doldur, kırpılabilir)",
  contain: "Sığdır (tam görünsün, kırpılmasın)",
  contain_blur: "Sığdır + bulanık arka plan",
};

export const HERO_IMAGE_POSITION_LABELS: Record<HeroImagePosition, string> = {
  "center center": "Orta",
  "top center": "Üst orta",
  "bottom center": "Alt orta",
  "left center": "Sol orta",
  "right center": "Sağ orta",
};
