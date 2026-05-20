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
  const a = (0.5 + t * 0.35).toFixed(3);
  const b = (0.22 + t * 0.2).toFixed(3);
  return `linear-gradient(95deg, rgba(10,12,16,${a}) 0%, rgba(10,12,16,${b}) 32%, transparent 52%)`;
}

function heroOverlayMobile(strength: number): string {
  const t = Math.min(100, Math.max(0, strength)) / 100;
  const bottom = (0.5 + t * 0.28).toFixed(3);
  return `linear-gradient(to top, rgba(10,12,16,${bottom}) 0%, rgba(10,12,16,0.12) 42%, transparent 70%)`;
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
    heroBrightness: slide?.heroBrightness ?? DEFAULT_HERO_IMAGE_DISPLAY.heroBrightness,
  };
}

function cssBackgroundUrl(src: string): string {
  const escaped = src.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${escaped}")`;
}

function HeroContainBlurLayer({
  src,
  desktop,
  mobile,
  blurScale = 105,
  brightness = 52,
}: {
  src: string;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  blurScale?: number;
  brightness?: number;
}) {
  const backgroundPosition = useHeroObjectPosition(desktop, mobile);
  const bg = cssBackgroundUrl(src);
  const scale = blurScale / 100;
  const bright = Math.min(80, Math.max(20, brightness)) / 100;
  const base: CSSProperties = {
    backgroundImage: bg,
    backgroundRepeat: "no-repeat",
    backgroundPosition,
  };

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 blur-md saturate-[0.9]"
        style={{
          ...base,
          backgroundSize: "cover",
          transform: `scale(${scale})`,
          filter: `brightness(${bright})`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[2]"
        style={{ ...base, backgroundSize: "cover" }}
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
      className="absolute inset-0 z-[2] h-full w-full"
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
  brightness,
  priority,
}: {
  src: string;
  alt: string;
  fit: HeroImageFit;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  blurScale?: number;
  brightness?: number;
  priority?: boolean;
}) {
  if (fit === "contain_blur") {
    return (
      <HeroContainBlurLayer
        src={src}
        desktop={desktop}
        mobile={mobile}
        blurScale={blurScale}
        brightness={brightness}
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
  const { imageFit, imagePosition, imagePositionMobile, backgroundBlurScale, heroBrightness } =
    slideDisplay(slide);

  return (
    <HeroImageLayer
      src={url}
      alt=""
      fit={imageFit}
      desktop={imagePosition}
      mobile={imagePositionMobile}
      blurScale={backgroundBlurScale}
      brightness={heroBrightness}
      priority={priority}
    />
  );
}

function HeroOverlays({ strength }: { strength: number }) {
  return (
    <>
      <div
        className="absolute inset-0 z-[4] hidden lg:block"
        style={{ backgroundImage: heroOverlayGradient(strength) }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[4] lg:hidden"
        style={{
          backgroundImage: `${heroOverlayMobile(strength)}, ${heroOverlayGradient(strength)}`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_90%_80%_at_65%_50%,transparent_35%,rgba(8,10,14,0.35)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-[#0a0c10] via-transparent to-[#0a0c10]/40 lg:hidden"
        aria-hidden
      />
    </>
  );
}

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

  const durationMs = reduceMotion ? 0 : 900;
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  const slideA = slides[slotA] ?? fallback;
  const slideB = slides[slotB] ?? fallback;
  const urlA = imageUrl(slideA, fallback);
  const urlB = imageUrl(slideB, fallback);
  const activeSlide = slides[safeIndex] ?? fallback;
  const overlayStrength = slideDisplay(activeSlide).overlayStrength ?? 58;

  const bgBase = (
    <div className="absolute inset-0 bg-gradient-to-br from-[#141820] via-[#10141c] to-[#0a0c10]" aria-hidden />
  );

  if (n <= 1) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {bgBase}
        {urlA ? (
          <div className="absolute inset-0 z-[1]">
            <SingleHeroLayer slide={slideA} fallback={fallback} priority />
          </div>
        ) : null}
        <HeroOverlays strength={overlayStrength} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      {bgBase}
      <div className="absolute inset-0 z-[1]">
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
