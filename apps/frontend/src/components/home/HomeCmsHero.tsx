"use client";

import { useMemo } from "react";
import { HomeHeroCarouselView } from "@/components/home/HomeHeroCarouselView";
import { apiAssetUrl } from "@/lib/api";
import type { HomeSection, SiteSettings } from "@/lib/settings";
import { defaultHeroSlides, parseHeroSlides } from "@/components/home/homeHeroDefaults";
import { DEFAULT_HERO_IMAGE_DISPLAY } from "@/components/home/homeHeroImage";

type Props = {
  section: HomeSection;
  settings: Pick<SiteSettings, "siteName" | "defaultMetaDesc" | "primaryColor" | "secondaryColor">;
};

export function HomeCmsHero({ section, settings }: Props) {
  const slides = useMemo(() => {
    const fromConfig = parseHeroSlides(section.config?.slides);
    if (fromConfig) {
      return fromConfig.map((slide) => ({
        ...slide,
        image: apiAssetUrl(slide.image) ?? slide.image,
      }));
    }
    const hasHeroFields = Boolean(section.title?.trim() || section.mediaUrl?.trim());
    if (hasHeroFields) {
      return [
        {
          eyebrow: section.subtitle?.trim() || "3D Baskı Hizmetleri",
          title: section.title?.trim() || settings.siteName,
          body:
            section.body?.trim() ||
            "Prototipten seri üretime; hızlı teslimat, premium filament ve güvenli ödeme ile projelerinizi hayata geçirin.",
          cta: section.ctaHref?.trim() || "/contact",
          ctaLabel: section.ctaLabel?.trim() || "Hemen Teklif Al",
          secondaryHref: "/shop",
          secondaryLabel: "Ürünleri İncele",
          image: apiAssetUrl(section.mediaUrl) ?? "",
          ...DEFAULT_HERO_IMAGE_DISPLAY,
          imageFit: "cover" as const,
        },
      ];
    }
    return defaultHeroSlides(settings).map((s) => ({
      ...s,
      image: apiAssetUrl(s.image) ?? s.image,
    }));
  }, [section, settings]);

  return <HomeHeroCarouselView slides={slides} primaryColor={settings.primaryColor} />;
}
