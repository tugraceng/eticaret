"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import { apiAssetUrl } from "@/lib/api";
import type { HomeSection, SiteSettings } from "@/lib/settings";
import { defaultHeroSlides, parseHeroSlides, type HomeHeroSlide } from "@/components/home/homeHeroDefaults";

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
    <section className="home-hero-default relative isolate min-h-[min(100svh,920px)] w-full overflow-hidden bg-neutral-950">
      <HomeHeroBackdrop slides={slides} index={index} />
      <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

      <div className="relative z-10 flex min-h-[min(100svh,920px)] flex-col justify-end px-5 pb-16 pt-28 sm:px-10 sm:pb-20 sm:pt-32 md:justify-center md:px-12 md:pb-24 lg:px-20">
        <motion.div
          key={index}
          className="mx-auto w-full max-w-[1400px] md:py-8"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.58,
            ease: [0.22, 1, 0.36, 1],
            delay: reduceMotion ? 0 : 0.08,
          }}
        >
          {active.eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b8def]">
              {active.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 max-w-[18ch] text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl md:max-w-[20ch] md:text-6xl lg:text-7xl">
            {active.title}
          </h1>
          {active.body ? (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85 sm:text-base md:max-w-lg">
              {active.body}
            </p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={active.cta}
              className="inline-flex min-h-[44px] items-center justify-center bg-neutral-950 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white ring-1 ring-white/10 transition hover:bg-black"
            >
              {active.ctaLabel}
            </Link>
            <Link
              href={active.secondaryHref}
              className="inline-flex min-h-[44px] items-center justify-center border border-white/90 bg-transparent px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              {active.secondaryLabel}
            </Link>
          </div>

          {slides.length > 1 ? (
            <div className="mt-14 flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={`${s.title}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Slayt ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-1.5 rounded-full transition-[width,background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    i === index ? "w-10 scale-100 bg-white" : "w-6 bg-white/35 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
