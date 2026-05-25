"use client";

import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onApplied?: () => void;
};

function parsePriceTl(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function paramsFromForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  const p = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || !v.trim()) continue;
    if (k === "minPrice") {
      const tl = parsePriceTl(v);
      if (tl != null) p.set("minPriceCents", String(Math.round(tl * 100)));
      continue;
    }
    if (k === "maxPrice") {
      const tl = parsePriceTl(v);
      if (tl != null) p.set("maxPriceCents", String(Math.round(tl * 100)));
      continue;
    }
    if (k === "categoryId") continue;
    p.set(k, v.trim());
  }
  return p;
}

export function ShopFiltersForm({ children, onApplied }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/shop";

  const apply = (form: HTMLFormElement) => {
    const qs = paramsFromForm(form).toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    // Yalnızca replace kullan; refresh() push ile yarışıp eski URL ile sunucuyu yenileyebilir.
    router.replace(target, { scroll: false });
    onApplied?.();
  };

  return (
    <form
      className="si-shop-filters-form space-y-3"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
