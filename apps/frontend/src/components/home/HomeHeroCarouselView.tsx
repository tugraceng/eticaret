"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeHeroArrows } from "@/components/home/HomeHeroArrows";
import { HomeHeroSlideImage } from "@/components/home/HomeHeroSlideImage";
import { HomeHeroTrustBadges } from "@/components/home/HomeHeroTrustBadges";
import type { HomeHeroSlide } from "@/components/home/homeHeroDefaults";
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
  const tagline =
    active.body?.trim() ||
    "Prototipten seri üretime; hızlı teslimat, premium filament ve güvenli ödeme ile projelerinizi hayata geçirin.";

  return (
    <section className={heroV2SectionClass} aria-label="Ana vitrin">
      <div className={heroV2InnerClass}>
        <div className={heroV2VisualClass}>
          <div className="absolute inset-0 bg-[#0e1218]" aria-hidden />
          <div className="absolute inset-0" key={`${index}-${active.image}`}>
            <HomeHeroSlideImage
              src={active.image}
              alt=""
              priority={index === 0}
              className="object-cover object-center lg:object-[center_35%]"
            />
          </div>
          {/* Mobil: alttan koyu gradient — metin okunurluğu */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0c10] from-25% via-[#0a0c10]/75 via-55% to-[#0a0c10]/25 lg:bg-gradient-to-l lg:from-[#0a0c10] lg:from-20% lg:via-[#0a0c10]/50 lg:via-45% lg:to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,transparent_20%,rgba(8,10,14,0.4)_100%)] lg:block"
            aria-hidden
          />

          <HomeHeroArrows visible={slides.length > 1} onPrev={goPrev} onNext={goNext} />

          {slides.length > 1 ? (
            <div
              className="pointer-events-auto absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 lg:flex"
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

        <div className={heroV2ContentClass}>
          <div className="si-hero-v2__copy w-full max-w-xl lg:max-w-lg xl:max-w-xl">
            <p className="si-hero-v2-kicker">{eyebrow}</p>

            <h1 className="si-hero-v2-title mt-2 text-balance">{active.title}</h1>

            <p className="si-hero-v2-lead mt-3 max-w-md text-pretty sm:mt-3.5">{tagline}</p>

            {slides.length > 1 ? (
              <div
                className="mt-4 flex items-center gap-2 lg:hidden"
                role="tablist"
                aria-label="Hero slaytları"
              >
                {slides.map((s, i) => (
                  <button
                    key={`dot-${s.title}-${i}`}
                    type="button"
                    role="tab"
                    onClick={() => setIndex(i)}
                    aria-label={`Slayt ${i + 1}`}
                    aria-selected={i === index}
                    className={`rounded-full transition-all duration-300 ${
                      i === index ? "h-1.5 w-5 bg-white" : "h-1.5 w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            ) : null}

            <div className="si-hero-v2-cta mt-4 flex w-full flex-col gap-2.5 sm:mt-5 lg:mt-6 lg:flex-row lg:gap-3">
              <Link
                href={active.cta}
                className="si-hero-v2-btn-primary w-full lg:w-auto lg:min-w-[11rem]"
                style={brandBtnStyle}
              >
                {active.ctaLabel}
              </Link>
              <Link
                href={active.secondaryHref}
                className="si-hero-v2-btn-outline w-full lg:w-auto lg:min-w-[11rem]"
              >
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
