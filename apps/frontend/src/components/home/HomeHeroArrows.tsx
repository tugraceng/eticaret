"use client";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {dir === "left" ? <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/** Tam genişlik hero üzerinde manuel slayt geçişi (önceki / sonraki). */
export function HomeHeroArrows({
  visible,
  onPrev,
  onNext,
}: {
  visible: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!visible) return null;

  const btn =
    "pointer-events-auto absolute top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:h-12 sm:w-12";

  return (
    <>
      <button type="button" className={`${btn} left-2 sm:left-4 md:left-6`} onClick={onPrev} aria-label="Önceki slayt">
        <Chevron dir="left" />
      </button>
      <button type="button" className={`${btn} right-2 sm:right-4 md:right-6`} onClick={onNext} aria-label="Sonraki slayt">
        <Chevron dir="right" />
      </button>
    </>
  );
}
