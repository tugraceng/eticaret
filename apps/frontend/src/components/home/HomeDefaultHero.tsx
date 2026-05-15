"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroBackdrop } from "@/components/home/HomeHeroBackdrop";
import type { SiteSettings } from "@/lib/settings";

type Props = {
  settings: Pick<SiteSettings, "siteName" | "defaultMetaDesc" | "primaryColor" | "secondaryColor">;
};

/** CMS hero kaldırıldı; anasayfa vitrin slaytları (tam genişlik, editorial CTA). */
export function HomeDefaultHero({ settings }: Props) {
  const slides = [
    {
      eyebrow: "Kendi atölyemizde üretim",
      title: "3D baskı ile hazır ürünler",
      body:
        settings.defaultMetaDesc?.trim() ||
        "Anahtarlık, figür ve hediye setleri — yazıcı satmıyoruz; bastığımız parçaları sunuyoruz. Güvenli ödeme ve hızlı kargo.",
      cta: "/shop",
      ctaLabel: "Alışverişe başla",
      secondaryHref: "/about",
      secondaryLabel: "Daha fazla bilgi",
      image:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=2000&q=80",
    },
    {
      eyebrow: "Hediye ve günlük kullanım",
      title: "Anahtarlık & küçük aksesuar",
      body: "Geometrik tasarımlar, seçili kişiselleştirme ve renk seçenekleri tek vitrinde.",
      cta: "/shop",
      ctaLabel: "Ürünlere git",
      secondaryHref: "/contact",
      secondaryLabel: "Özel talep",
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=2000&q=80",
    },
    {
      eyebrow: "Ev ve masaüstü",
      title: "Dekor, lamba gövdesi, düzen",
      body: "Çalışma alanınıza zarif dokunuş; stoktan sevkiyat ve özenli paketleme.",
      cta: "/shop",
      ctaLabel: "Keşfet",
      secondaryHref: "/#urunler",
      secondaryLabel: "Tüm ürünler",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
    },
  ] as const;

  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const active = slides[index];

  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section className="home-hero-default relative isolate min-h-[min(100svh,920px)] w-full overflow-hidden bg-neutral-950">
      <HomeHeroBackdrop slides={slides} index={index} />
      <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

      <div className="relative z-10 flex min-h-[min(100svh,920px)] flex-col justify-center px-5 pb-14 pt-20 sm:px-10 sm:pb-16 sm:pt-24 md:min-h-[min(100svh,920px)] md:justify-center md:px-12 md:pb-24 md:pt-32 lg:px-20">
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b8def]">
            {active.eyebrow}
          </p>
          <h1 className="mt-4 max-w-[18ch] text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl md:max-w-[20ch] md:text-6xl lg:text-7xl">
            {active.title}
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85 sm:text-base md:max-w-lg">
            {active.body}
          </p>

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

          <div className="mt-14 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.title}
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
        </motion.div>
      </div>
    </section>
  );
}
