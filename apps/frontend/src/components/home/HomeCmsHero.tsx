"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import { apiAssetUrl } from "@/lib/api";
import type { HomeSection, SiteSettings } from "@/lib/settings";
import { defaultHeroSlides, parseHeroSlides, type HomeHeroSlide } from "@/components/home/homeHeroDefaults";
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
          eyebrow: section.subtitle?.trim() ?? "",
          title: section.title?.trim() || settings.siteName,
          body: "",
          cta: section.ctaHref?.trim() || "/shop",
          ctaLabel: section.ctaLabel?.trim() || "Koleksiyonu keşfet",
          secondaryHref: "/contact",
          secondaryLabel: "Özel sipariş",
          image: apiAssetUrl(section.mediaUrl) ?? "",
          imageFit: "contain_blur",
          imagePosition: "center center",
          imagePositionMobile: "center center",
        },
      ];
    }
    return defaultHeroSlides(settings).map((s) => ({ ...s, body: "" }));
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

  return (
    <section
      className={`relative isolate flex w-full flex-col overflow-hidden bg-[#121212] ${heroSectionMinHeightClass}`}
      aria-label="Ana vitrin"
    >
      <div className={heroVisualPanelClass}>
        <HomeHeroBackdrop slides={slides} index={index} />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#121212]/40 via-transparent to-[#121212]/80 lg:bg-gradient-to-r lg:from-[#121212] lg:via-[#121212]/50 lg:to-transparent"
        aria-hidden
      />

      <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

      <div className={`relative z-10 flex flex-1 flex-col ${heroContentPaddingClass}`}>
        <div className={heroGridClass}>
          <motion.div
            key={index}
            className={heroContentLayoutClass}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {eyebrow ? <p className="si-kicker mb-3">{eyebrow}</p> : null}

            <h1 className="si-display max-w-[13ch]">
              <HomeHeroTitle title={active.title} />
            </h1>

            <div className="si-hero-cta mt-6 flex w-full max-w-sm flex-col gap-3 sm:mt-8 lg:max-w-md">
              <Link href={active.cta} className="si-btn-primary w-full sm:w-auto">
                {active.ctaLabel}
              </Link>
              <Link
                href={active.secondaryHref}
                className="text-sm font-semibold text-slate-400 transition hover:text-sky-300"
              >
                {active.secondaryLabel}
                <span aria-hidden> →</span>
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
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === index ? "w-8 bg-sky-400" : "w-5 bg-white/20 hover:bg-white/35"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
