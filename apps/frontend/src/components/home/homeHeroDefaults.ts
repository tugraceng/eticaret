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
      eyebrow: "StoneIron3D",
      title: "Precision Crafted Objects",
      body: "Engineered layer by layer — modern collectibles for desk, gift and display.",
      cta: "/shop",
      ctaLabel: "Koleksiyonu keşfet",
      secondaryHref: "/about",
      secondaryLabel: "Atölye hikayesi",
      image:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
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
      eyebrow: typeof o.eyebrow === "string" ? o.eyebrow : "",
      title,
      body: typeof o.body === "string" ? o.body : "",
      cta: typeof o.cta === "string" && o.cta.length > 0 ? o.cta : "/shop",
      ctaLabel: typeof o.ctaLabel === "string" && o.ctaLabel.length > 0 ? o.ctaLabel : "Keşfet",
      secondaryHref:
        typeof o.secondaryHref === "string" && o.secondaryHref.length > 0 ? o.secondaryHref : "/shop",
      secondaryLabel:
        typeof o.secondaryLabel === "string" && o.secondaryLabel.length > 0
          ? o.secondaryLabel
          : "Tümü",
      image,
      ...display,
    });
  }
  return out.length > 0 ? out : null;
}
