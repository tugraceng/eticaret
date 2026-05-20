"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import {
  heroContentLayoutClass,
  heroContentPaddingClass,
  heroGridClass,
  heroSectionMinHeightClass,
  heroVisualPanelClass,
} from "@/components/home/homeHeroLayout";
import { HomeHeroTitle } from "@/components/home/HomeHeroTitle";
import { DEFAULT_HERO_IMAGE_DISPLAY } from "@/components/home/homeHeroImage";
export function HomeDefaultHero() {
  const slides = [
    {
      eyebrow: "StoneIron3D",
      title: "Yeni nesil 3D baskı dünyası",
      cta: "/shop",
      ctaLabel: "Koleksiyonu keşfet",
      secondaryHref: "/contact",
      secondaryLabel: "Özel sipariş",
      image:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
    },
  ];

  const index = 0;
  const reduceMotion = useReducedMotion();
  const active = slides[index]!;

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
      <HomeHeroArrows visible={false} onPrev={() => {}} onNext={() => {}} />

      <div className={`relative z-10 flex flex-1 flex-col ${heroContentPaddingClass}`}>
        <div className={heroGridClass}>
          <motion.div
            className={heroContentLayoutClass}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {active.eyebrow ? <p className="si-kicker mb-3">{active.eyebrow}</p> : null}
            <h1 className="si-display max-w-[13ch]">
              <HomeHeroTitle title={active.title} />
            </h1>
            <div className="si-hero-cta mt-6 flex w-full max-w-sm flex-col gap-3 sm:mt-8">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
