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
    <section className="si-section-alt border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="si-kicker">Son görüntülenenler</p>
            <h2 className="si-heading mt-2 text-xl sm:text-2xl">Kaldığınız yerden devam edin</h2>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 text-sm font-semibold text-sky-400/90 hover:text-sky-300 sm:inline-flex"
          >
            Tüm ürünler →
          </Link>
        </div>
        <ul className="mt-6 grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {items.slice(0, 8).map((p) => (
            <li key={p.id} className="flex min-h-0">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
        <Link
          href="/shop"
          className="mt-4 inline-flex text-sm font-semibold text-sky-400/90 hover:text-sky-300 sm:hidden"
        >
          Tüm ürünler →
        </Link>
      </div>
    </section>
  );
}
