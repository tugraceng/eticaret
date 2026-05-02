"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE_TOAST_EVENT, type SiteToastDetail, type SiteToastKind } from "@/lib/site-toast";

type ToastItem = { id: number; message: string; kind: SiteToastKind };

const styles: Record<SiteToastKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function SiteToaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((detail: SiteToastDetail) => {
    const id = Date.now() + Math.random();
    const kind = detail.kind ?? "info";
    setItems((prev) => [...prev, { id, message: detail.message, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<SiteToastDetail>;
      if (ce.detail?.message) push(ce.detail);
    };
    window.addEventListener(SITE_TOAST_EVENT, handler as EventListener);
    return () => window.removeEventListener(SITE_TOAST_EVENT, handler as EventListener);
  }, [push]);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-1/2 z-[90] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col gap-2 sm:bottom-8"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${styles[t.kind]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
