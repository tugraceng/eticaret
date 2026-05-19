"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { ProductListRow } from "@/components/store/ProductListRow";

export type CatalogPayload = {
  items: ProductCardData[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function ShopCatalogGrid({
  initial,
  queryWithoutPage,
  layout = "grid",
  hasActiveFilters,
}: {
  initial: CatalogPayload;
  /** URLSearchParams string without `page` (e.g. sort=newest&limit=12) */
  queryWithoutPage: string;
  layout?: "grid" | "list";
  /** Arama / kategori / fiyat / stok vb. seçiliyse boş liste bu metni kullanır. */
  hasActiveFilters: boolean;
}) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasNext, setHasNext] = useState(initial.hasNext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
    setHasNext(initial.hasNext);
  }, [initial, queryWithoutPage]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading) return;
    setLoading(true);
    try {
      const next = page + 1;
      const qs = new URLSearchParams(queryWithoutPage);
      qs.set("page", String(next));
      if (!qs.has("limit")) qs.set("limit", "12");
      const res = await fetch(apiUrl(`/products/catalog?${qs.toString()}`), { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as CatalogPayload;
      setItems((prev) => [...prev, ...data.items]);
      setPage(data.page);
      setHasNext(data.hasNext);
    } catch {
      /* yükleme hatası — sessizce dur */
    } finally {
      setLoading(false);
    }
  }, [hasNext, loading, page, queryWithoutPage]);

  const isList = layout === "list";
  const emptyCopy = hasActiveFilters
    ? "Filtrelerle eşleşen ürün bulunamadı."
    : "Henüz listelenecek ürün yok.";

  return (
    <>
      {isList ? (
        <ul className="mt-2 flex flex-col gap-4">
          {items.length === 0 ? (
            <li className="rounded-ds-xl border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface-muted)] p-10 text-center text-small text-[var(--ds-text-muted)]">
              {emptyCopy}
            </li>
          ) : (
            items.map((p) => <ProductListRow key={p.id} product={p} />)
          )}
        </ul>
      ) : (
        <ul className="mt-2 grid items-stretch gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {items.length === 0 ? (
            <li className="col-span-full rounded-ds-xl border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface-muted)] p-10 text-center text-small text-[var(--ds-text-muted)]">
              {emptyCopy}
            </li>
          ) : (
            items.map((p) => (
              <li key={p.id} className="flex h-full min-h-0">
                <ProductCard product={p} />
              </li>
            ))
          )}
        </ul>
      )}

      {items.length > 0 && hasNext ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="btn-primary min-h-12 min-w-[200px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Yükleniyor…" : "Daha fazla yükle"}
          </button>
          <p className="text-center text-micro text-[var(--ds-text-muted)]">
            Her istekte 12 ürün — kontrollü veri kullanımı.
          </p>
        </div>
      ) : null}

      {initial.totalPages > 1 && !hasNext && items.length > 0 ? (
        <p className="mt-6 text-center text-micro text-[var(--ds-text-muted)]">
          Tüm sonuçlar yüklendi ({initial.total} ürün).
        </p>
      ) : null}
    </>
  );
}
