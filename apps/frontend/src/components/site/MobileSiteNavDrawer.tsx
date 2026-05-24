"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

function MenuCloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Header içinde `fixed` kırpılmasın diye body'ye portal — kapalıyken DOM'da kalmaz. */
export function MobileSiteNavDrawer({ open, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || typeof document === "undefined" || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-[2px] md:hidden"
        aria-label="Menüyü kapat"
        onClick={onClose}
      />
      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal
        aria-label="Site menüsü"
        className="si-mobile-drawer fixed inset-y-0 right-0 z-[201] flex w-[min(88vw,20rem)] flex-col border-l border-white/10 bg-[#0f141c] shadow-2xl md:hidden"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-white">Menü</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white"
            aria-label="Kapat"
          >
            <MenuCloseIcon />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </aside>
    </>,
    document.body,
  );
}
