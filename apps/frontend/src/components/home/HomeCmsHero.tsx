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
          body: section.body?.trim() || settings.defaultMetaDesc?.trim() || "",
          cta: section.ctaHref?.trim() || "/shop",
          ctaLabel: section.ctaLabel?.trim() || "Keşfet",
          secondaryHref: "/shop",
          secondaryLabel: "Tümü",
          image: apiAssetUrl(section.mediaUrl) ?? "",
          imageFit: "contain_blur",
          imagePosition: "center center",
          imagePositionMobile: "center center",
        },
      ];
    }
    return defaultHeroSlides(settings);
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

  return (
    <section
      className={`relative isolate flex w-full flex-col overflow-hidden bg-[#121212] ${heroSectionMinHeightClass}`}
      aria-label="Ana vitrin"
    >
      <div className={heroVisualPanelClass}>
        <HomeHeroBackdrop slides={slides} index={index} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(59,130,246,0.12),transparent_55%)]" aria-hidden />

      <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

      <div className={`relative z-10 flex flex-1 flex-col ${heroContentPaddingClass}`}>
        <div className={heroGridClass}>
          <motion.div
            key={index}
            className={heroContentLayoutClass}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {active.eyebrow ? (
                <span className="si-kicker">{active.eyebrow}</span>
              ) : (
                <span className="si-kicker">Precision Engineering</span>
              )}
            </div>

            <h1 className="si-display max-w-[14ch] sm:max-w-[16ch]">
              <HomeHeroTitle title={active.title} />
            </h1>

            {active.body ? (
              <p className="si-body mt-4 max-w-md max-md:hidden lg:mt-5 lg:block lg:max-w-lg">{active.body}</p>
            ) : null}

            <div className="mt-4 hidden flex-wrap gap-4 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 md:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-sky-500" aria-hidden />
                Precision print
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-sky-500/60" aria-hidden />
                Collectible finish
              </span>
            </div>

            <div className="si-hero-cta mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-10 md:max-w-none md:flex-row md:flex-wrap md:items-center">
              <Link href={active.cta} className="si-btn-primary w-full md:w-auto">
                {active.ctaLabel}
              </Link>
              <Link
                href={active.secondaryHref}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 text-sm font-semibold text-slate-300 transition hover:text-sky-300 md:w-auto md:min-h-0 md:justify-start"
              >
                {active.secondaryLabel}
                <span aria-hidden>→</span>
              </Link>
            </div>

            {slides.length > 1 ? (
              <div className="mt-8 flex items-center gap-2 lg:mt-10" role="tablist" aria-label="Hero slaytları">
                {slides.map((s, i) => (
                  <button
                    key={`${s.title}-${i}`}
                    type="button"
                    role="tab"
                    onClick={() => setIndex(i)}
                    aria-label={`Slayt ${i + 1}`}
                    aria-selected={i === index}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === index ? "w-10 bg-sky-400" : "w-6 bg-white/25 hover:bg-white/45"
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
