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
  /** 0–100 — metin okunabilirliği gradient (varsayılan 58) */
  overlayStrength?: number;
  /** contain_blur arka plan blur ölçeği % (100–130, varsayılan 105) */
  backgroundBlurScale?: number;
  /** contain_blur arka plan parlaklığı % (20–80, varsayılan 52) */
  heroBrightness?: number;
};

export const DEFAULT_HERO_IMAGE_DISPLAY: HeroImageDisplay = {
  imageFit: "cover",
  imagePosition: "center center",
  imagePositionMobile: null,
  overlayStrength: 58,
  backgroundBlurScale: 105,
  heroBrightness: 52,
};

function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

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
    overlayStrength: clampInt(
      o.hero_overlay_strength ?? o.overlayStrength ?? o.overlay_strength,
      0,
      100,
      DEFAULT_HERO_IMAGE_DISPLAY.overlayStrength!,
    ),
    backgroundBlurScale: clampInt(
      o.hero_background_blur ?? o.backgroundBlurScale ?? o.background_blur,
      100,
      130,
      DEFAULT_HERO_IMAGE_DISPLAY.backgroundBlurScale!,
    ),
    heroBrightness: clampInt(
      o.hero_brightness ?? o.heroBrightness ?? o.brightness,
      20,
      80,
      DEFAULT_HERO_IMAGE_DISPLAY.heroBrightness!,
    ),
  };
}

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
  contain: "Sığdır (ürün önde, önerilen)",
  contain_blur: "Sığdır + hafif bulanık arka plan",
};

export const HERO_IMAGE_POSITION_LABELS: Record<HeroImagePosition, string> = {
  "center center": "Orta",
  "top center": "Üst orta",
  "bottom center": "Alt orta",
  "left center": "Sol orta",
  "right center": "Sağ orta",
};
