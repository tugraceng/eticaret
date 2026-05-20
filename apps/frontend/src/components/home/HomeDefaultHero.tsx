"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import { DEFAULT_HERO_IMAGE_DISPLAY } from "@/components/home/homeHeroImage";
import {
  heroContentLayoutClass,
  heroContentPaddingClass,
  heroGridClass,
  heroSectionMinHeightClass,
  heroVisualPanelClass,
} from "@/components/home/homeHeroLayout";
import { HomeHeroTitle } from "@/components/home/HomeHeroTitle";

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

  const index = 0;
  const reduceMotion = useReducedMotion();
  const active = slides[index]!;

  return (
    <section
      className={`si-hero relative isolate flex w-full flex-col overflow-hidden bg-[#0c0e12] ${heroSectionMinHeightClass}`}
      aria-label="Ana vitrin"
    >
      <div className={heroVisualPanelClass}>
        <HomeHeroBackdrop slides={slides} index={index} />
      </div>

      <div className={`relative z-10 flex flex-1 flex-col ${heroContentPaddingClass}`}>
        <div className={heroGridClass}>
          <motion.div
            className={heroContentLayoutClass}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {active.eyebrow ? <p className="si-kicker mb-3">{active.eyebrow}</p> : null}
            <h1 className="si-display max-w-[14ch] text-balance">
              <HomeHeroTitle title={active.title} />
            </h1>
            <p className="si-hero-tagline mt-4 max-w-md">{active.body}</p>
            <div className="si-hero-cta mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href={active.cta} className="si-btn-primary w-full sm:w-auto">
                {active.ctaLabel}
              </Link>
              <Link href={active.secondaryHref} className="si-btn-ghost w-full sm:w-auto">
                {active.secondaryLabel}
              </Link>
            </div>
          </motion.div>
          <div className="hidden min-h-[12rem] lg:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
