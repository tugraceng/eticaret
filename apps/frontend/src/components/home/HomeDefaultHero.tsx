"use client";

import { HomeHeroCarouselView } from "@/components/home/HomeHeroCarouselView";
import { DEFAULT_HERO_IMAGE_DISPLAY } from "@/components/home/homeHeroImage";

export function HomeDefaultHero() {
  const slides = [
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

  return <HomeHeroCarouselView slides={slides} />;
}
