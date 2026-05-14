"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** `?h=slug` ile sayfadaki `id` öğesine kaydırır (eski detay URL’leri için). */
export function CmsAnchorScroll({ param = "h" }: { param?: string }) {
  const sp = useSearchParams();

  useEffect(() => {
    const raw = sp.get(param)?.trim();
    if (!raw) return;
    const id = decodeURIComponent(raw);
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [sp, param]);

  return null;
}
