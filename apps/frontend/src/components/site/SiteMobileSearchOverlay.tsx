"use client";

import { Suspense, useEffect } from "react";
import { createPortal } from "react-dom";
import { SiteHeaderSearch } from "@/components/site/SiteHeaderSearch";

type Props = {
  open: boolean;
  onClose: () => void;
};

function SearchBody({ onClose }: { onClose: () => void }) {
  return (
    <SiteHeaderSearch
      variant="sheet"
      searchPlaceholder="Koleksiyonlarda ara…"
      onNavigate={onClose}
    />
  );
}

/** Mobil header arama ikonu — tam ekran arama paneli */
export function SiteMobileSearchOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[210] md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Aramayı kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ürün ara"
        className="si-mobile-search-panel absolute inset-x-0 top-0 max-h-[min(92dvh,640px)] overflow-y-auto overscroll-contain rounded-b-2xl border-b border-white/10 bg-[#0f141c] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 py-3">
          <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-white">Ara</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        <div className="mx-auto max-w-lg pb-4">
          <Suspense
            fallback={
              <div className="h-12 animate-pulse rounded-xl bg-white/10" aria-hidden />
            }
          >
            <SearchBody onClose={onClose} />
          </Suspense>
        </div>
      </div>
    </div>,
    document.body,
  );
}
