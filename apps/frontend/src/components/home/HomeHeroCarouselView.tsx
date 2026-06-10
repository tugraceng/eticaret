"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import { HomeHeroTitle } from "@/components/home/HomeHeroTitle";
import type { HomeHeroSlide } from "@/components/home/homeHeroDefaults";
import {
  heroCarouselContentClass,
  heroCarouselFrameClass,
  heroCarouselOuterClass,
  heroCarouselSectionClass,
} from "@/components/home/homeHeroLayout";

const AUTO_MS = 5000;

export function HomeHeroCarouselView({ slides }: { slides: HomeHeroSlide[] }) {
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
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const active = slides[index] ?? slides[0];
  if (!active) return null;

  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);
  const eyebrow = active.eyebrow?.trim();
  const tagline = active.body?.trim();

  return (
    <section className={heroCarouselSectionClass} aria-label="Ana vitrin">
      <div className={heroCarouselOuterClass}>
        <div className={heroCarouselFrameClass}>
          <HomeHeroBackdrop slides={slides} index={index} />

          <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

          <div className={heroCarouselContentClass}>
            <motion.div
              key={index}
              className="pointer-events-auto"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {eyebrow ? <p className="si-kicker mb-3">{eyebrow}</p> : null}

              <h1 className="si-display max-w-[14ch] text-balance lg:max-w-[12ch]">
                <HomeHeroTitle title={active.title} />
              </h1>

              {tagline ? <p className="si-hero-tagline mt-4 max-w-md">{tagline}</p> : null}

              <div className="si-hero-cta mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link href={active.cta} className="si-btn-primary w-full sm:w-auto">
                  {active.ctaLabel}
                </Link>
                <Link href={active.secondaryHref} className="si-btn-ghost w-full sm:w-auto">
                  {active.secondaryLabel}
                </Link>
              </div>
            </motion.div>
          </div>

          {slides.length > 1 ? (
            <div
              className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-5"
              role="tablist"
              aria-label="Hero slaytları"
            >
              {slides.map((s, i) => (
                <button
                  key={`${s.title}-${i}`}
                  type="button"
                  role="tab"
                  onClick={() => setIndex(i)}
                  aria-label={`Slayt ${i + 1}`}
                  aria-selected={i === index}
                  className={`rounded-full transition-all duration-500 ${
                    i === index ? "h-2 w-2 bg-white" : "h-2 w-2 bg-white/35 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
