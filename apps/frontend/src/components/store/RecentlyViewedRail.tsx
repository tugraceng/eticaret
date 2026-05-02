"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { RECENT_PRODUCTS_STORAGE_KEY, RECENT_PRODUCTS_UPDATE_EVENT } from "@/lib/recent-products";

const MAX = 12;

function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_PRODUCTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

export function RecentlyViewedRail() {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(() => {
    const ids = readRecentIds();
    if (!ids.length) {
      setItems([]);
      setReady(true);
      return;
    }
    const q = ids.join(",");
    void (async () => {
      try {
        const res = await fetch(`${apiUrl("/products")}?ids=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = (await res.json()) as ProductCardData[];
        const map = new Map((Array.isArray(data) ? data : []).map((p) => [p.id, p]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as ProductCardData[];
        setItems(ordered);
      } catch {
        setItems([]);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    load();
    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === RECENT_PRODUCTS_STORAGE_KEY) load();
    };
    window.addEventListener(RECENT_PRODUCTS_UPDATE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(RECENT_PRODUCTS_UPDATE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [load]);

  const show = useMemo(() => ready && items.length > 0, [ready, items.length]);
  if (!show) return null;

  return (
    <section className="mx-auto mt-16 w-full max-w-6xl border-t border-slate-200 px-4 pt-10 sm:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Son görüntülenenler
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Kaldığınız yerden devam edin
          </h2>
        </div>
        <Link href="/shop" className="hidden text-sm font-semibold text-slate-700 hover:text-slate-900 sm:inline-flex">
          Tüm ürünler →
        </Link>
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.slice(0, 8).map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

