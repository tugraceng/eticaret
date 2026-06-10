"use client";

import { HomeHeroCarouselView } from "@/components/home/HomeHeroCarouselView";
import { defaultHeroSlides } from "@/components/home/homeHeroDefaults";

export function HomeDefaultHero() {
  return <HomeHeroCarouselView slides={defaultHeroSlides({ defaultMetaDesc: null })} />;
}
