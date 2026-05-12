"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type ImageItem = { url: string; alt: string | null };

export function ProductGallery({
  productName,
  images,
  onSale,
}: {
  productName: string;
  images: ImageItem[];
  onSale: boolean;
}) {
  const pathname = usePathname();
  const labelId = useId();
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const list = images.length > 0 ? images : [];
  const main = list[active] ?? list[0];

  const closeZoom = useCallback(() => setZoomOpen(false), []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    closeZoom();
  }, [pathname, closeZoom]);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
    };
    document.addEventListener("keydown", onKey);
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [zoomOpen, closeZoom]);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
    };
  }, []);

  if (list.length === 0) {
    return (
      <div className="fade-up">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-8 text-center text-sm text-slate-400">
          Görsel yok
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div
        className="group relative aspect-[4/5] max-h-[min(80vh,720px)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/5"
        aria-labelledby={labelId}
      >
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="relative block h-full w-full touch-manipulation outline-none ring-slate-900/40 focus-visible:ring-2"
          aria-label={`${main?.alt ?? productName} — büyük görüntüle`}
        >
          <Image
            src={main?.url ?? ""}
            alt={main?.alt ?? productName}
            fill
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover transition duration-500 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.02]"
            priority={active === 0}
          />
        </button>
        {onSale && (
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            İndirim
          </span>
        )}
        <p id={labelId} className="sr-only">
          Ürün görseli {active + 1} / {list.length}
        </p>
      </div>
      {list.length > 1 && (
        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
          role="tablist"
          aria-label="Ürün görselleri"
        >
          {list.slice(0, 8).map((img, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition",
                active === i
                  ? "border-slate-900 ring-2 ring-slate-900/20"
                  : "border-slate-200 opacity-80 hover:opacity-100",
              )}
              aria-label={img.alt ?? `${productName} — görsel ${i + 1}`}
            >
              <Image
                src={img.url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {zoomOpen ? (
                <motion.div
                  role="presentation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-[2px] sm:p-6"
                  onClick={closeZoom}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Büyütülmüş ürün görseli"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    className="relative flex max-h-[min(92dvh,900px)] max-w-[min(92vw,1100px)] flex-col items-center touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={closeZoom}
                      className="absolute -right-1 -top-10 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white hover:bg-white/20 sm:-top-12"
                      aria-label="Kapat (Esc)"
                      title="Kapat (Esc)"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-lg font-light leading-none" aria-hidden>
                        ×
                      </span>
                      <span className="pr-0.5 text-xs font-semibold">Esc</span>
                    </button>
                    <div className="relative max-h-[min(85dvh,820px)] w-full overflow-hidden rounded-xl bg-black/20 shadow-2xl">
                      <Image
                        src={main?.url ?? ""}
                        alt={main?.alt ?? productName}
                        width={1200}
                        height={1200}
                        className="max-h-[min(85dvh,820px)] w-auto max-w-full object-contain"
                        priority
                      />
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
