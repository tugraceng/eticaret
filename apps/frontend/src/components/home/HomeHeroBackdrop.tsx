"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const HERO_BG_GRADIENT =
  "linear-gradient(105deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.2) 100%)";

type SlideImg = { image: string };

function bgStyle(slide: SlideImg | undefined, fallback: SlideImg) {
  const img = slide?.image ?? fallback.image;
  return {
    backgroundImage: `${HERO_BG_GRADIENT}, url(${img})`,
  } as const;
}

/**
 * İki katmanlı opaklık crossfade — background-image doğrudan animasyonlanamadığı için
 * üst üste iki görsel katmanı kullanır.
 */
export function HomeHeroBackdrop({
  slides,
  index,
}: {
  slides: readonly SlideImg[];
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

  if (n <= 1) {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
        style={bgStyle(slides[safeIndex], fallback)}
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <div
        className="absolute inset-0 bg-cover bg-center will-change-[opacity]"
        style={{
          ...bgStyle(slides[slotA], fallback),
          opacity: showA ? 1 : 0,
          transition: `opacity ${durationMs}ms ${ease}`,
          zIndex: showA ? 2 : 1,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-cover bg-center will-change-[opacity]"
        style={{
          ...bgStyle(slides[slotB], fallback),
          opacity: showA ? 0 : 1,
          transition: `opacity ${durationMs}ms ${ease}`,
          zIndex: showA ? 1 : 2,
        }}
        aria-hidden
      />
    </div>
  );
}
