"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, memo, useState, useEffect, useRef } from "react";
import { ShopToolbar } from "@/app/(site)/shop/ShopToolbar";
import { ShopCatalogGrid, type CatalogPayload } from "@/app/(site)/shop/ShopCatalogGrid";
import type { CategoryApiRow } from "@/lib/category-nav";
import { cn } from "@/lib/cn";
import { isPersonalizedCategory, PERSONALIZED_ORDER_NOTICE } from "@/lib/personalized-category";

function sortCategories(a: CategoryApiRow, b: CategoryApiRow) {
  const o = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (o !== 0) return o;
  return a.name.localeCompare(b.name, "tr");
}
export type ShopSortKey = "newest" | "price_asc" | "price_desc" | "popular" | "bestseller";

function toQuery(base: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v && v.trim()) p.set(k, v.trim());
  }
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

const ViewToggle = memo(function ViewToggle({ view }: { view: "grid" | "list" }) {
  const pathname = usePathname() ?? "/shop";
  const sp = useSearchParams();

  const buildHref = useCallback(
    (next: "grid" | "list") => {
      const p = new URLSearchParams(sp.toString());
      if (next === "list") p.set("view", "list");
      else p.delete("view");
      p.delete("page");
      const qs = p.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [pathname, sp],
  );

  return (
    <div className="si-view-toggle flex h-11 shrink-0 p-1" role="group" aria-label="Görünüm">
      <Link
        href={buildHref("grid")}
        scroll={false}
        className={view === "grid" ? "si-view-toggle-active" : "si-view-toggle-item"}
        aria-pressed={view === "grid"}
        prefetch
      >
        Izgara
      </Link>
      <Link
        href={buildHref("list")}
        scroll={false}
        className={view === "list" ? "si-view-toggle-active" : "si-view-toggle-item"}
        aria-pressed={view === "list"}
        prefetch
      >
        Liste
      </Link>
    </div>
  );
});

export function ShopPageClient({
  title,
  categories,
  catalog,
  catalogQs,
  baseParams,
  q,
  categoryId,
  sort,
  sorts,
  minPriceCents,
  maxPriceCents,
  minAvgRating,
  inStockOnly,
  onSaleOnly,
  featuredOnly,
  newOnly,
  page,
  view,
  hasActiveCatalogFilters,
  activeCategory,
}: {
  title: string;
  categories: CategoryApiRow[];
  catalog: CatalogPayload;
  catalogQs: string;
  baseParams: Record<string, string | undefined>;
  q?: string;
  categoryId?: string;
  sort: ShopSortKey;
  sorts: Array<{ key: ShopSortKey; label: string }>;
  minPriceCents?: number;
  maxPriceCents?: number;
  minAvgRating?: string;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  featuredOnly: boolean;
  newOnly: boolean;
  page: number;
  view: "grid" | "list";
  hasActiveCatalogFilters: boolean;
  activeCategory?: CategoryApiRow | null;
}) {
  const showPersonalizedNotice = isPersonalizedCategory(activeCategory ?? null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersSheetCloseRef = useRef<HTMLButtonElement>(null);
  const rootCategories = categories.filter((c) => !c.parentId).slice().sort(sortCategories);

  useEffect(() => {
    if (!filtersOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (mq.matches) {
      window.requestAnimationFrame(() => filtersSheetCloseRef.current?.focus());
    }
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const applyScrollLock = () => {
      document.body.style.overflow = mq.matches ? "hidden" : "";
    };
    applyScrollLock();
    mq.addEventListener("change", applyScrollLock);
    return () => {
      mq.removeEventListener("change", applyScrollLock);
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);
  const childCategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId).slice().sort(sortCategories);
  const orphanCategories = categories.filter(
    (c) => c.parentId && !categories.some((p) => p.id === c.parentId),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="si-page-card mb-6 p-5 sm:p-6 lg:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="si-heading text-2xl sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-400">{catalog.total} ürün</p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <ShopToolbar />
            </div>
            <ViewToggle view={view} />
          </div>
        </div>

        <div className="mt-3 flex w-full flex-wrap items-stretch gap-2 lg:hidden">
          <div className="min-w-0 min-h-11 flex-1 basis-[min(100%,11rem)]">
            <ViewToggle view={view} />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="si-shop-filters-trigger min-h-11 flex-1 basis-[min(100%,11rem)]"
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
          >
            Filtreler
          </button>
        </div>
      </header>

      {showPersonalizedNotice ? (
        <div className="si-personalized-notice mb-6" role="note">
          <p className="text-sm leading-relaxed">{PERSONALIZED_ORDER_NOTICE}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "fixed inset-0 z-[55] bg-[var(--ds-text)]/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          filtersOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!filtersOpen}
        onClick={() => setFiltersOpen(false)}
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-8 xl:gap-10">
        <aside
          className={cn(
            "flex max-h-[min(90dvh,640px)] flex-col overflow-hidden rounded-ds-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-card transition-transform duration-300 ease-out",
            "lg:z-10 lg:mb-0 lg:max-h-none lg:translate-y-0 lg:overflow-visible",
            "lg:sticky lg:top-24",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-[60] max-lg:rounded-b-none max-lg:rounded-t-3xl",
            filtersOpen ? "max-lg:translate-y-0" : "max-lg:translate-y-[110%] max-lg:pointer-events-none",
          )}
          aria-modal={filtersOpen ? true : undefined}
          role={filtersOpen ? "dialog" : undefined}
          aria-labelledby="shop-filters-sheet-title"
        >
          <div className="flex shrink-0 flex-col items-stretch border-b border-white/10 lg:hidden">
            <div className="flex justify-center pt-2 pb-1" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <p id="shop-filters-sheet-title" className="text-base font-semibold text-slate-100">
                Filtreler
              </p>
              <button
                ref={filtersSheetCloseRef}
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-400 hover:bg-white/6 hover:text-slate-100"
              >
                Kapat
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:overflow-visible">
            <form
              key={`${catalogQs}|${page}`}
              method="GET"
              action="/shop"
              className="si-shop-filters-form space-y-3 p-4 pb-6 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              onSubmit={() => setFiltersOpen(false)}
            >
              <p className="hidden text-h3 lg:block">Filtreler</p>
            <select
              key={categoryId ?? "all"}
              name="categoryId"
              defaultValue={categoryId ?? ""}
              className="input-soft min-h-11 w-full !rounded-ds-lg"
              aria-label="Kategori seç"
            >
              {q?.trim() ? (
                <option value="">Tüm arama sonuçları</option>
              ) : (
                <option value="">Tüm ürünler</option>
              )}
              {rootCategories.length > 0 ? (
                rootCategories.map((r) => {
                  const children = childCategories(r.id);
                  return (
                    <optgroup key={r.id} label={r.name}>
                      <option value={r.id}>{r.name} — tümü</option>
                      {children.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })
              ) : (
                categories
                  .slice()
                  .sort(sortCategories)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
              )}
              {orphanCategories.length > 0 ? (
                <optgroup label="Diğer">
                  {orphanCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className="input-soft min-h-11 w-full !rounded-ds-lg"
              aria-label="Sıralama"
            >
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              name="minAvgRating"
              defaultValue={minAvgRating ?? ""}
              className="input-soft min-h-11 w-full !rounded-ds-lg"
              aria-label="Minimum ortalama puan"
            >
              <option value="">Tüm değerlendirmeler</option>
              <option value="4">4+ yıldız (ortalama)</option>
              <option value="3">3+ yıldız (ortalama)</option>
              <option value="2">2+ yıldız (ortalama)</option>
            </select>
            <input
              name="minPriceCents"
              type="number"
              min={0}
              defaultValue={minPriceCents ?? ""}
              placeholder="Min fiyat"
              className="input-soft min-h-11 w-full !rounded-ds-lg"
            />
            <input
              name="maxPriceCents"
              type="number"
              min={0}
              defaultValue={maxPriceCents ?? ""}
              placeholder="Max fiyat"
              className="input-soft min-h-11 w-full !rounded-ds-lg"
            />
            <label className="si-shop-filter-chip">
              <input type="checkbox" name="inStock" value="1" defaultChecked={inStockOnly} />
              Yalnızca stokta olanlar
            </label>
            <label className="si-shop-filter-chip">
              <input type="checkbox" name="onSale" value="1" defaultChecked={onSaleOnly} />
              İndirimli ürünler
            </label>
            <label className="si-shop-filter-chip">
              <input type="checkbox" name="featured" value="1" defaultChecked={featuredOnly} />
              Öne çıkanlar
            </label>
            <label className="si-shop-filter-chip">
              <input type="checkbox" name="newProduct" value="1" defaultChecked={newOnly} />
              Yeni ürünler
            </label>
            {view === "list" ? <input type="hidden" name="view" value="list" /> : null}
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button type="submit" className="btn-primary min-h-11 flex-1">
                Uygula
              </button>
              <Link
                href="/shop"
                onClick={() => setFiltersOpen(false)}
                className="btn-ghost flex min-h-11 flex-1 items-center justify-center"
              >
                Sıfırla
              </Link>
            </div>
          </form>
          </div>
        </aside>

        <div className="min-w-0">
          <ShopCatalogGrid
            key={`${catalogQs}|${page}`}
            initial={catalog}
            queryWithoutPage={catalogQs}
            layout={view}
            hasActiveFilters={hasActiveCatalogFilters}
          />
        </div>
      </div>

      {catalog.totalPages > 1 && page > 1 ? (
        <p className="mt-8 text-center text-small text-[var(--ds-text-muted)]">
          Bu liste sayfa {page} ile açıldı.{" "}
          <Link href={`/shop${toQuery({ ...baseParams, page: "1" })}`} className="font-semibold text-[var(--ds-text)] underline">
            İlk sayfaya dön
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
