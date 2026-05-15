"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Metin okunabilirliği — görselin üstünde; görsel ayrı katmanda `contain` ile tam gösterilir. */
const HERO_OVERLAY =
  "linear-gradient(105deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.2) 100%)";

type SlideImg = { image: string };

function imageBg(slide: SlideImg | undefined, fallback: SlideImg) {
  const url = slide?.image?.trim() || fallback.image?.trim();
  if (!url) return null;
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "contain" as const,
    backgroundPosition: "center" as const,
    backgroundRepeat: "no-repeat" as const,
  };
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

  const styleA = imageBg(slides[slotA], fallback);
  const styleB = imageBg(slides[slotB], fallback);

  if (n <= 1) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-950" aria-hidden>
        {styleA ? <div className="absolute inset-0" style={styleA} /> : null}
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: HERO_OVERLAY }} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-950" aria-hidden>
      <div className="absolute inset-0">
        {styleA ? (
          <div
            className="absolute inset-0 will-change-[opacity]"
            style={{
              ...styleA,
              opacity: showA ? 1 : 0,
              transition: `opacity ${durationMs}ms ${ease}`,
              zIndex: showA ? 2 : 1,
            }}
          />
        ) : null}
        {styleB ? (
          <div
            className="absolute inset-0 will-change-[opacity]"
            style={{
              ...styleB,
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
