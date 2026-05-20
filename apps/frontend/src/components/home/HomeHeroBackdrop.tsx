"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  DEFAULT_HERO_IMAGE_DISPLAY,
  heroImagePositionVars,
  type HeroImageDisplay,
  type HeroImageFit,
  type HeroImagePosition,
} from "@/components/home/homeHeroImage";
import { useHeroObjectPosition } from "@/components/home/useHeroObjectPosition";
import { apiAssetUrl } from "@/lib/api";

/** Metin okunabilirliği */
const HERO_OVERLAY =
  "linear-gradient(105deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.2) 100%)";

const HERO_SIZES = "100vw";

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
  };
}

function HeroPositionedImage({
  src,
  alt,
  className,
  desktop,
  mobile,
  hostStyle,
  priority,
  quality,
}: {
  src: string;
  alt: string;
  className: string;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  hostStyle: CSSProperties;
  priority?: boolean;
  quality?: number;
}) {
  const objectPosition = useHeroObjectPosition(desktop, mobile);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={HERO_SIZES}
      quality={quality}
      priority={priority}
      className={className}
      style={{ ...hostStyle, objectPosition }}
    />
  );
}

function HeroImageLayer({
  src,
  alt,
  fit,
  desktop,
  mobile,
  positionVars,
  priority,
  quality,
}: {
  src: string;
  alt: string;
  fit: HeroImageFit;
  desktop: HeroImagePosition;
  mobile: HeroImagePosition | null;
  positionVars: Record<string, string>;
  priority?: boolean;
  quality?: number;
}) {
  const hostStyle = positionVars as CSSProperties;

  if (fit === "contain_blur") {
    return (
      <div
        className="hero-image-position-host absolute inset-0"
        style={hostStyle}
        aria-hidden
      >
        <HeroPositionedImage
          src={src}
          alt=""
          desktop={desktop}
          mobile={mobile}
          hostStyle={hostStyle}
          priority={priority}
          quality={45}
          className="scale-110 object-cover blur-2xl brightness-[0.35] saturate-[0.85]"
        />
        <HeroPositionedImage
          src={src}
          alt={alt}
          desktop={desktop}
          mobile={mobile}
          hostStyle={hostStyle}
          priority={priority}
          quality={quality ?? 78}
          className="relative z-[1] object-contain"
        />
      </div>
    );
  }

  const objectFitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className="hero-image-position-host absolute inset-0" style={hostStyle}>
      <HeroPositionedImage
        src={src}
        alt={alt}
        desktop={desktop}
        mobile={mobile}
        hostStyle={hostStyle}
        priority={priority}
        quality={quality ?? (fit === "cover" ? 82 : 78)}
        className={objectFitClass}
      />
    </div>
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
  const { imageFit, imagePosition, imagePositionMobile } = slideDisplay(slide);
  const positionVars = heroImagePositionVars(imagePosition, imagePositionMobile);

  return (
    <HeroImageLayer
      src={url}
      alt=""
      fit={imageFit}
      desktop={imagePosition}
      mobile={imagePositionMobile}
      positionVars={positionVars}
      priority={priority}
    />
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

  if (n <= 1) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-950" aria-hidden>
        {urlA ? (
          <div className="absolute inset-0">
            <SingleHeroLayer slide={slideA} fallback={fallback} priority />
          </div>
        ) : null}
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: HERO_OVERLAY }} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-950" aria-hidden>
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
      <div className="absolute inset-0 z-[1]" style={{ backgroundImage: HERO_OVERLAY }} />
    </div>
  );
}
