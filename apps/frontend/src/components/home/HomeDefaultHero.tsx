"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
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
import type { SiteSettings } from "@/lib/settings";

type Props = {
  settings: Pick<SiteSettings, "siteName" | "defaultMetaDesc" | "primaryColor" | "secondaryColor">;
};

export function HomeDefaultHero({ settings }: Props) {
  const slides = [
    {
      eyebrow: "Engineered for precision",
      title: "3D baskı ile hazır ürünler",
      body:
        settings.defaultMetaDesc?.trim() ||
        "Anahtarlık, figür ve hediye setleri — atölyemizde basıyoruz. Güvenli ödeme ve hızlı kargo.",
      cta: "/shop",
      ctaLabel: "Alışverişe başla",
      secondaryHref: "/about",
      secondaryLabel: "Daha fazla bilgi",
      image:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
    },
    {
      eyebrow: "Collectible finish",
      title: "Anahtarlık & küçük aksesuar",
      body: "Geometrik tasarımlar, seçili kişiselleştirme ve renk seçenekleri tek vitrinde.",
      cta: "/shop",
      ctaLabel: "Ürünlere git",
      secondaryHref: "/contact",
      secondaryLabel: "Özel talep",
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
    },
    {
      eyebrow: "Crafted layer by layer",
      title: "Dekor & masaüstü parçalar",
      body: "Çalışma alanınıza zarif dokunuş; stoktan sevkiyat ve özenli paketleme.",
      cta: "/shop",
      ctaLabel: "Keşfet",
      secondaryHref: "/#urunler",
      secondaryLabel: "Tüm ürünler",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
      ...DEFAULT_HERO_IMAGE_DISPLAY,
    },
  ];

  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const active = slides[index]!;

  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section
      className={`relative isolate flex w-full flex-col overflow-hidden bg-[#121212] ${heroSectionMinHeightClass}`}
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
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="si-kicker">{active.eyebrow}</p>
            <h1 className="si-display mt-2 max-w-[14ch]">
              <HomeHeroTitle title={active.title} />
            </h1>
            <p className="si-body mt-4 max-w-md max-md:hidden">{active.body}</p>
            <div className="si-hero-cta mt-6 flex w-full max-w-md flex-col gap-3 md:flex-row md:flex-wrap">
              <Link href={active.cta} className="si-btn-primary w-full md:w-auto">
                {active.ctaLabel}
              </Link>
              <Link
                href={active.secondaryHref}
                className="inline-flex min-h-[44px] items-center justify-center gap-1 text-sm font-semibold text-slate-300 hover:text-sky-300 md:min-h-0"
              >
                {active.secondaryLabel}
                <span aria-hidden>→</span>
              </Link>
            </div>
            {slides.length > 1 ? (
              <div className="mt-8 flex gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Slayt ${i + 1}`}
                    className={`h-1 rounded-full transition-all ${i === index ? "w-10 bg-sky-400" : "w-6 bg-white/25"}`}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
