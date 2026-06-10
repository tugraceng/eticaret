"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroSlideImage } from "@/components/home/HomeHeroSlideImage";
import { HomeHeroTrustBadges } from "@/components/home/HomeHeroTrustBadges";
import { HERO_DEFAULT_BADGE, type HomeHeroSlide } from "@/components/home/homeHeroDefaults";
import {
  heroV2ContentClass,
  heroV2InnerClass,
  heroV2SectionClass,
  heroV2VisualClass,
} from "@/components/home/homeHeroLayout";

const AUTO_MS = 5000;

type Props = {
  slides: HomeHeroSlide[];
  primaryColor?: string;
};

export function HomeHeroCarouselView({ slides, primaryColor }: Props) {
  const [index, setIndex] = useState(0);

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

  const brandBtnStyle =
    primaryColor?.trim() ?
      ({ backgroundColor: primaryColor.trim(), borderColor: primaryColor.trim() } as const)
    : undefined;

  const eyebrow = active.eyebrow?.trim() || "3D Baskı Hizmetleri";
  const badge = active.badge?.trim() || HERO_DEFAULT_BADGE;
  const tagline =
    active.body?.trim() ||
    "Prototipten seri üretime; hızlı teslimat, premium filament ve güvenli ödeme ile projelerinizi hayata geçirin.";

  return (
    <section className={heroV2SectionClass} aria-label="Ana vitrin">
      <div className={heroV2InnerClass}>
        {/* Görsel — mobilde üstte */}
        <div className={heroV2VisualClass}>
          <div className="absolute inset-0 bg-[#0e1218]" aria-hidden />
          <div className="absolute inset-0" key={`${index}-${active.image}`}>
            <HomeHeroSlideImage
              src={active.image}
              alt=""
              priority={index === 0}
              className="lg:object-[center_30%]"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/20 to-transparent lg:bg-gradient-to-l lg:from-[#0a0c10] lg:via-[#0a0c10]/30 lg:to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,transparent_20%,rgba(8,10,14,0.45)_100%)]"
            aria-hidden
          />

          <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

          {slides.length > 1 ? (
            <div
              className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 lg:bottom-5"
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
                  className={`rounded-full transition-all duration-300 ${
                    i === index ? "h-2 w-6 bg-white" : "h-2 w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Metin — mobilde altta */}
        <div className={heroV2ContentClass}>
          <div className="si-hero-v2__copy mx-auto w-full max-w-xl lg:mx-0 lg:max-w-lg xl:max-w-xl">
            <p className="si-hero-v2-badge inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
              {badge}
            </p>

            <p className="si-hero-v2-kicker mt-4">{eyebrow}</p>

            <h1 className="si-hero-v2-title mt-2 text-balance">{active.title}</h1>

            <p className="si-hero-v2-lead mt-3 max-w-md text-pretty sm:mt-4">{tagline}</p>

            <div className="si-hero-v2-cta mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
              <Link
                href={active.cta}
                className="si-hero-v2-btn-primary w-full sm:w-auto sm:min-w-[11rem]"
                style={brandBtnStyle}
              >
                {active.ctaLabel}
              </Link>
              <Link href={active.secondaryHref} className="si-hero-v2-btn-outline w-full sm:w-auto sm:min-w-[11rem]">
                {active.secondaryLabel}
              </Link>
            </div>

            <HomeHeroTrustBadges />
          </div>
        </div>
      </div>
    </section>
  );
}
