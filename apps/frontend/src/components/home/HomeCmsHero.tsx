"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import { apiAssetUrl } from "@/lib/api";
import type { HomeSection, SiteSettings } from "@/lib/settings";
import { defaultHeroSlides, parseHeroSlides, type HomeHeroSlide } from "@/components/home/homeHeroDefaults";
import { DEFAULT_HERO_IMAGE_DISPLAY } from "@/components/home/homeHeroImage";
import { HomeHeroTitle } from "@/components/home/HomeHeroTitle";
import {
  heroContentLayoutClass,
  heroContentPaddingClass,
  heroGridClass,
  heroSectionMinHeightClass,
  heroVisualPanelClass,
} from "@/components/home/homeHeroLayout";

type Props = {
  section: HomeSection;
  settings: Pick<SiteSettings, "siteName" | "defaultMetaDesc" | "primaryColor" | "secondaryColor">;
};

export function HomeCmsHero({ section, settings }: Props) {
  const slides = useMemo((): HomeHeroSlide[] => {
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
          eyebrow: section.subtitle?.trim() ?? "StoneIron3D",
          title: section.title?.trim() || settings.siteName,
          body:
            section.body?.trim() ||
            "Engineered layer by layer — modern collectibles for desk, gift and display.",
          cta: section.ctaHref?.trim() || "/shop",
          ctaLabel: section.ctaLabel?.trim() || "Koleksiyonu keşfet",
          secondaryHref: "/about",
          secondaryLabel: "Atölye hikayesi",
          image: apiAssetUrl(section.mediaUrl) ?? "",
          ...DEFAULT_HERO_IMAGE_DISPLAY,
        },
      ];
    }
    return defaultHeroSlides(settings).map((s) => ({
      ...s,
      image: apiAssetUrl(s.image) ?? s.image,
    }));
  }, [section, settings]);

  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!slides.length) return;
    setIndex((i) => Math.min(i, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const active = slides[index] ?? slides[0]!;
  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);
  const eyebrow = active.eyebrow?.trim();
  const tagline = active.body?.trim();

  return (
    <section
      className={`si-hero relative isolate flex w-full flex-col overflow-hidden bg-[#0c0e12] ${heroSectionMinHeightClass}`}
      aria-label="Ana vitrin"
    >
      <div className={heroVisualPanelClass}>
        <HomeHeroBackdrop slides={slides} index={index} />
      </div>

      <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

      <div className={`relative z-10 flex flex-1 flex-col ${heroContentPaddingClass}`}>
        <div className={heroGridClass}>
          <motion.div
            key={index}
            className={heroContentLayoutClass}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {eyebrow ? <p className="si-kicker mb-3">{eyebrow}</p> : null}

            <h1 className="si-display max-w-[14ch] text-balance">
              <HomeHeroTitle title={active.title} />
            </h1>

            {tagline ? (
              <p className="si-hero-tagline mt-4 max-w-md">{tagline}</p>
            ) : null}

            <div className="si-hero-cta mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href={active.cta} className="si-btn-primary w-full sm:w-auto">
                {active.ctaLabel}
              </Link>
              <Link href={active.secondaryHref} className="si-btn-ghost w-full sm:w-auto">
                {active.secondaryLabel}
              </Link>
            </div>

            {slides.length > 1 ? (
              <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Hero slaytları">
                {slides.map((s, i) => (
                  <button
                    key={`${s.title}-${i}`}
                    type="button"
                    role="tab"
                    onClick={() => setIndex(i)}
                    aria-label={`Slayt ${i + 1}`}
                    aria-selected={i === index}
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      i === index ? "w-8 bg-white/80" : "w-5 bg-white/25 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
          <div className="hidden min-h-[12rem] lg:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
