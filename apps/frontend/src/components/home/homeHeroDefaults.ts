import type { SiteSettings } from "@/lib/settings";
import {
  DEFAULT_HERO_IMAGE_DISPLAY,
  parseHeroImageDisplay,
  type HeroImageDisplay,
  type HeroImageFit,
  type HeroImagePosition,
} from "@/components/home/homeHeroImage";

export type HomeHeroSlide = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  ctaLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  image: string;
} & HeroImageDisplay;

export type { HeroImageFit, HeroImagePosition };
export { DEFAULT_HERO_IMAGE_DISPLAY };

export function defaultHeroSlides(
  _settings: Pick<SiteSettings, "defaultMetaDesc">,
): HomeHeroSlide[] {
  return [
    {
      eyebrow: "3D Baskı Hizmetleri",
      title: "Profesyonel 3D Baskı Çözümleri",
      body: "Prototipten seri üretime; hızlı teslimat, premium filament ve güvenli ödeme ile projelerinizi hayata geçirin.",
      cta: "/contact",
      ctaLabel: "Hemen Teklif Al",
      secondaryHref: "/shop",
      secondaryLabel: "Ürünleri İncele",
      image:
        "https://images.unsplash.com/photo-1631540577672-411958b86278?auto=format&fit=crop&w=1920&h=1080&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
      imageFit: "cover",
      imagePosition: "center center",
      imagePositionMobile: "center center",
      overlayStrength: 12,
    },
  ];
}

export function parseHeroSlides(raw: unknown): HomeHeroSlide[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: HomeHeroSlide[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const o = row as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const image = typeof o.image === "string" ? o.image.trim() : "";
    if (!title || !image) continue;
    const display = parseHeroImageDisplay(o);
    out.push({
      eyebrow: typeof o.eyebrow === "string" ? o.eyebrow : "3D Baskı Hizmetleri",
      title,
      body: typeof o.body === "string" ? o.body : "",
      cta: typeof o.cta === "string" && o.cta.length > 0 ? o.cta : "/contact",
      ctaLabel:
        typeof o.ctaLabel === "string" && o.ctaLabel.length > 0 ? o.ctaLabel : "Hemen Teklif Al",
      secondaryHref:
        typeof o.secondaryHref === "string" && o.secondaryHref.length > 0 ? o.secondaryHref : "/shop",
      secondaryLabel:
        typeof o.secondaryLabel === "string" && o.secondaryLabel.length > 0
          ? o.secondaryLabel
          : "Ürünleri İncele",
      image,
      ...display,
      imageFit: "cover",
    });
  }
  return out.length > 0 ? out : null;
}
