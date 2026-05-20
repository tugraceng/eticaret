"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  DEFAULT_HERO_IMAGE_DISPLAY,
  type HeroImageDisplay,
  type HeroImageFit,
  type HeroImagePosition,
} from "@/components/home/homeHeroImage";
import { useHeroObjectPosition } from "@/components/home/useHeroObjectPosition";
import { apiAssetUrl } from "@/lib/api";
function heroOverlayGradient(strength: number): string {
  const t = Math.min(100, Math.max(0, strength)) / 100;
  const a = (0.55 + t * 0.4).toFixed(3);
  const b = (0.28 + t * 0.35).toFixed(3);
  const c = (0.12 + t * 0.2).toFixed(3);
  return `linear-gradient(105deg, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${b}) 42%, rgba(7,11,18,${c}) 68%, transparent 100%)`;
}

function heroOverlayMobile(strength: number): string {
  const t = Math.min(100, Math.max(0, strength)) / 100;
  const bottom = (0.65 + t * 0.3).toFixed(3);
  return `linear-gradient(to top, rgba(7,11,18,${bottom}) 0%, rgba(7,11,18,0.25) 45%, transparent 72%)`;
}

export type HeroBackdropSlide = {
  image: string;
} & Partial<HeroImageDisplay>;

function imageUrl(slide: HeroBackdropSlide | undefined, fallback: HeroBackdropSlide) {
  const url = slide?.image?.trim() || fallback.image?.trim();
  if (!url) return null;
  return apiAssetUrl(url) ?? url;
}

function slideDisplay(slide: HeroBackdropSlide | undefined): HeroImageDisplay {
  return {
    imageFit: slide?.imageFit ?? DEFAULT_HERO_IMAGE_DISPLAY.imageFit,
    imagePosition: slide?.imagePosition ?? DEFAULT_HERO_IMAGE_DISPLAY.imagePosition,
    imagePositionMobile: slide?.imagePositionMobile ?? DEFAULT_HERO_IMAGE_DISPLAY.imagePositionMobile,
    overlayStrength: slide?.overlayStrength ?? DEFAULT_HERO_IMAGE_DISPLAY.overlayStrength,
    backgroundBlurScale: slide?.backgroundBlurScale ?? DEFAULT_HERO_IMAGE_DISPLAY.backgroundBlurScale,
  };
}

function cssBackgroundUrl(src: string): string {
  const escaped = src.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${escaped}")`;
}

/** contain_blur — background-size/position masaüstünde img relative hatasından etkilenmez */
function HeroContainBlurLayer({
  src,
  desktop,
  mobile,
  blurScale = 110,
}: {
  src: string;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  blurScale?: number;
}) {
  const backgroundPosition = useHeroObjectPosition(desktop, mobile);
  const bg = cssBackgroundUrl(src);
  const scale = blurScale / 100;
  const base: CSSProperties = {
    backgroundImage: bg,
    backgroundRepeat: "no-repeat",
    backgroundPosition,
  };

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 blur-2xl brightness-[0.35] saturate-[0.85]"
        style={{ ...base, backgroundSize: "cover", transform: `scale(${scale})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{ ...base, backgroundSize: "contain" }}
        aria-hidden
      />
    </div>
  );
}

function HeroNativeImage({
  src,
  alt,
  fit,
  desktop,
  mobile,
  priority,
}: {
  src: string;
  alt: string;
  fit: Exclude<HeroImageFit, "contain_blur">;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  priority?: boolean;
}) {
  const objectPosition = useHeroObjectPosition(desktop, mobile);
  const objectFit: CSSProperties["objectFit"] = fit === "contain" ? "contain" : "cover";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className="absolute inset-0 h-full w-full"
      style={{ objectFit, objectPosition }}
    />
  );
}

function HeroImageLayer({
  src,
  alt,
  fit,
  desktop,
  mobile,
  blurScale,
  priority,
}: {
  src: string;
  alt: string;
  fit: HeroImageFit;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  blurScale?: number;
  priority?: boolean;
}) {
  if (fit === "contain_blur") {
    return (
      <HeroContainBlurLayer
        src={src}
        desktop={desktop}
        mobile={mobile}
        blurScale={blurScale}
      />
    );
  }

  return (
    <HeroNativeImage
      src={src}
      alt={alt}
      fit={fit}
      desktop={desktop}
      mobile={mobile}
      priority={priority}
    />
  );
}

function SingleHeroLayer({
  slide,
  fallback,
  priority,
}: {
  slide: HeroBackdropSlide;
  fallback: HeroBackdropSlide;
  priority?: boolean;
}) {
  const url = imageUrl(slide, fallback);
  if (!url) return null;
  const { imageFit, imagePosition, imagePositionMobile, backgroundBlurScale } = slideDisplay(slide);

  return (
    <HeroImageLayer
      src={url}
      alt=""
      fit={imageFit}
      desktop={imagePosition}
      mobile={imagePositionMobile}
      blurScale={backgroundBlurScale}
      priority={priority}
    />
  );
}

function HeroOverlays({ strength }: { strength: number }) {
  return (
    <>
      <div
        className="absolute inset-0 z-[1] hidden lg:block"
        style={{ backgroundImage: heroOverlayGradient(strength) }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1] lg:hidden"
        style={{
          backgroundImage: `${heroOverlayMobile(strength)}, ${heroOverlayGradient(strength)}`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#121212] via-[#121212]/80 to-transparent lg:max-w-[42%]"
        aria-hidden
      />
    </>
  );
}

/**
 * Hero görsel katmanı + gradient. İki slayt için opaklık crossfade.
 */
export function HomeHeroBackdrop({
  slides,
  index,
}: {
  slides: readonly HeroBackdropSlide[];
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const n = slides.length;
  const safeIndex = n ? Math.min(Math.max(0, index), n - 1) : 0;
  const fallback = slides[0] ?? { image: "" };

  const prevIndexRef = useRef(safeIndex);
  const [slotA, setSlotA] = useState(safeIndex);
  const [slotB, setSlotB] = useState(safeIndex);
  const [showA, setShowA] = useState(true);

  useEffect(() => {
    if (n <= 1) {
      setSlotA(safeIndex);
      setSlotB(safeIndex);
      prevIndexRef.current = safeIndex;
      return;
    }
    if (safeIndex === prevIndexRef.current) return;
    prevIndexRef.current = safeIndex;

    setShowA((wasA) => {
      if (wasA) setSlotB(safeIndex);
      else setSlotA(safeIndex);
      return !wasA;
    });
  }, [safeIndex, n]);

  const durationMs = reduceMotion ? 0 : 1000;
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  const slideA = slides[slotA] ?? fallback;
  const slideB = slides[slotB] ?? fallback;
  const urlA = imageUrl(slideA, fallback);
  const urlB = imageUrl(slideB, fallback);
  const activeSlide = slides[safeIndex] ?? fallback;
  const overlayStrength = slideDisplay(activeSlide).overlayStrength ?? 72;

  if (n <= 1) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#121212]" aria-hidden>
        {urlA ? (
          <div className="absolute inset-0">
            <SingleHeroLayer slide={slideA} fallback={fallback} priority />
          </div>
        ) : null}
        <HeroOverlays strength={overlayStrength} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-[#121212]" aria-hidden>
      <div className="absolute inset-0">
        {urlA ? (
          <div
            className="absolute inset-0 will-change-[opacity]"
            style={{
              opacity: showA ? 1 : 0,
              transition: `opacity ${durationMs}ms ${ease}`,
              zIndex: showA ? 2 : 1,
            }}
          >
            <SingleHeroLayer
              slide={slideA}
              fallback={fallback}
              priority={safeIndex === 0 && slotA === 0 && showA}
            />
          </div>
        ) : null}
        {urlB ? (
          <div
            className="absolute inset-0 will-change-[opacity]"
            style={{
              opacity: showA ? 0 : 1,
              transition: `opacity ${durationMs}ms ${ease}`,
              zIndex: showA ? 1 : 2,
            }}
          >
            <SingleHeroLayer
              slide={slideB}
              fallback={fallback}
              priority={safeIndex === 0 && slotB === 0 && !showA}
            />
          </div>
        ) : null}
      </div>
      <HeroOverlays strength={overlayStrength} />
    </div>
  );
}
