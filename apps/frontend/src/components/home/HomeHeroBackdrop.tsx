"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Metin okunabilirliği — görsel `cover`, üstten hizalı (logo üstte kalır). */
const HERO_OVERLAY =
  "linear-gradient(105deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.2) 100%)";

/** Mobilde odak biraz aşağı — üst logo alanı daha görünür; md+ üst sabit. */
const HERO_IMG_LAYER_CLASS =
  "absolute inset-0 bg-cover bg-no-repeat max-md:bg-[position:center_12%] md:bg-[position:center_top]";

type SlideImg = { image: string };

function imageUrl(slide: SlideImg | undefined, fallback: SlideImg) {
  const url = slide?.image?.trim() || fallback.image?.trim();
  return url || null;
}

/**
 * Görsel katmanı + üstte gradient. İki slayt için opaklık crossfade.
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

  const urlA = imageUrl(slides[slotA], fallback);
  const urlB = imageUrl(slides[slotB], fallback);

  if (n <= 1) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-950" aria-hidden>
        {urlA ? (
          <div className={HERO_IMG_LAYER_CLASS} style={{ backgroundImage: `url(${urlA})` }} />
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
            className={`${HERO_IMG_LAYER_CLASS} will-change-[opacity]`}
            style={{
              backgroundImage: `url(${urlA})`,
              opacity: showA ? 1 : 0,
              transition: `opacity ${durationMs}ms ${ease}`,
              zIndex: showA ? 2 : 1,
            }}
          />
        ) : null}
        {urlB ? (
          <div
            className={`${HERO_IMG_LAYER_CLASS} will-change-[opacity]`}
            style={{
              backgroundImage: `url(${urlB})`,
              opacity: showA ? 0 : 1,
              transition: `opacity ${durationMs}ms ${ease}`,
              zIndex: showA ? 1 : 2,
            }}
          />
        ) : null}
      </div>
      <div className="absolute inset-0 z-[1]" style={{ backgroundImage: HERO_OVERLAY }} />
    </div>
  );
}
