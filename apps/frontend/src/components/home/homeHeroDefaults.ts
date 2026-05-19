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
  settings: Pick<SiteSettings, "defaultMetaDesc">,
): HomeHeroSlide[] {
  return [
    {
      eyebrow: "Atölyeden hazır",
      title: "3D baskı hediyelik & dekor",
      body:
        settings.defaultMetaDesc?.trim() ||
        "Anahtarlık, figür ve masaüstü parçalar — hepsini kendi atölyemizde basıyoruz. Güvenli ödeme ve stoktan gönderim.",
      cta: "/shop",
      ctaLabel: "Alışverişe başla",
      secondaryHref: "/about",
      secondaryLabel: "Daha fazla bilgi",
      image:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
    },
    {
      eyebrow: "Hediye",
      title: "Anahtarlık & kişisel dokunuş",
      body:
        "Seçili ürünlerde kısa yazı veya renk tercihi; özenli paketleme ile kapınıza kadar.",
      cta: "/shop",
      ctaLabel: "Ürünlere git",
      secondaryHref: "/contact",
      secondaryLabel: "Bize ulaşın",
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
    },
    {
      eyebrow: "Ev & ofis",
      title: "Dekor ve düzen",
      body:
        "Lambası gövdesinden masa düzenleyiciye; çalışma köşene hazır baskı çözümler.",
      cta: "/shop",
      ctaLabel: "Keşfet",
      secondaryHref: "/#urunler",
      secondaryLabel: "Vitrin",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
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
