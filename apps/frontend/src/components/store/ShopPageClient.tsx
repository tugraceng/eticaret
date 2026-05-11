"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, memo, useState, useEffect, useRef } from "react";
import { ShopToolbar } from "@/app/(site)/shop/ShopToolbar";
import { ShopCatalogGrid, type CatalogPayload } from "@/app/(site)/shop/ShopCatalogGrid";
import { shopBrowseHref, type CategoryApiRow } from "@/lib/category-nav";
import { cn } from "@/lib/cn";

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
    <div
      className="flex h-11 shrink-0 rounded-ds-lg border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] p-1"
      role="group"
      aria-label="Görünüm"
    >
      <Link
        href={buildHref("grid")}
        scroll={false}
        className={`grid flex-1 place-items-center rounded-lg px-3 text-micro font-semibold transition-colors ${
          view === "grid"
            ? "bg-[var(--ds-surface-inverse)] text-[var(--ds-surface)]"
            : "text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
        }`}
        aria-pressed={view === "grid"}
        prefetch
      >
        Izgara
      </Link>
      <Link
        href={buildHref("list")}
        scroll={false}
        className={`grid flex-1 place-items-center rounded-lg px-3 text-micro font-semibold transition-colors ${
          view === "list"
            ? "bg-[var(--ds-surface-inverse)] text-[var(--ds-surface)]"
            : "text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
        }`}
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
  hubMode,
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
}: {
  title: string;
  hubMode: boolean;
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
}) {
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
  const hubRoots =
    rootCategories.length > 0 ? rootCategories : categories.slice().sort(sortCategories);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <header className="mb-6 flex flex-col gap-4 lg:mb-10 lg:gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <h1 className="text-h1 text-[var(--ds-text)] md:text-display md:text-4xl">{title}</h1>
            <p className="mt-2 text-body text-[var(--ds-text-muted)]">
              {hubMode ? "Ürünleri görmek için bir kategori seçin." : `${catalog.total} ürün bulundu`}
            </p>
          </div>
          <div className="hidden w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex lg:max-w-2xl">
            <div className="min-w-0 flex-1">
              <ShopToolbar />
            </div>
            {!hubMode ? <ViewToggle view={view} /> : null}
          </div>
        </div>

        <div className="w-full min-w-0 lg:hidden">
          <ShopToolbar />
        </div>

        {!hubMode ? (
          <div className="flex w-full flex-wrap items-stretch gap-2 lg:hidden">
            <div className="min-w-0 min-h-11 flex-1 basis-[min(100%,11rem)]">
              <ViewToggle view={view} />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-11 flex-1 basis-[min(100%,11rem)] items-center justify-center gap-2 rounded-ds-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 py-2 text-sm font-semibold text-[var(--ds-text)] shadow-card"
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
            >
              Filtreler
            </button>
          </div>
        ) : null}
      </header>

      {!hubMode ? (
        <div
          className={cn(
            "fixed inset-0 z-[55] bg-[var(--ds-text)]/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
            filtersOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!filtersOpen}
          onClick={() => setFiltersOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          !hubMode && "lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-8 xl:gap-10",
        )}
      >
        {!hubMode ? (
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
          <div className="flex shrink-0 flex-col items-stretch border-b border-[var(--ds-border)] lg:hidden">
            <div className="flex justify-center pt-2 pb-1" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-[var(--ds-border)]" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <p id="shop-filters-sheet-title" className="text-base font-semibold text-[var(--ds-text)]">
                Filtreler
              </p>
              <button
                ref={filtersSheetCloseRef}
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ds-text-muted)] hover:bg-[var(--ds-surface-muted)] hover:text-[var(--ds-text)]"
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
              className="space-y-3 p-4 pb-6 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              onSubmit={() => setFiltersOpen(false)}
            >
              <p className="hidden text-h3 text-[var(--ds-text)] lg:block">Filtreler</p>
            <select
              key={categoryId ?? "all"}
              name="categoryId"
              defaultValue={categoryId ?? ""}
              className="input-soft min-h-11 w-full !rounded-ds-lg"
              aria-label="Kategori seç"
            >
              {q?.trim() ? <option value="">Tüm arama sonuçları</option> : null}
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
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-ds-lg border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-3 py-2 text-small text-[var(--ds-text)]">
              <input
                type="checkbox"
                name="inStock"
                value="1"
                defaultChecked={inStockOnly}
                className="h-4 w-4 rounded border-[var(--ds-border)]"
              />
              Yalnızca stokta olanlar
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-ds-lg border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-3 py-2 text-small text-[var(--ds-text)]">
              <input
                type="checkbox"
                name="onSale"
                value="1"
                defaultChecked={onSaleOnly}
                className="h-4 w-4 rounded border-[var(--ds-border)]"
              />
              İndirimli ürünler
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-ds-lg border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-3 py-2 text-small text-[var(--ds-text)]">
              <input
                type="checkbox"
                name="featured"
                value="1"
                defaultChecked={featuredOnly}
                className="h-4 w-4 rounded border-[var(--ds-border)]"
              />
              Öne çıkanlar
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-ds-lg border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-3 py-2 text-small text-[var(--ds-text)]">
              <input
                type="checkbox"
                name="newProduct"
                value="1"
                defaultChecked={newOnly}
                className="h-4 w-4 rounded border-[var(--ds-border)]"
              />
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
        ) : null}

        <div className="min-w-0">
          {hubMode ? (
            hubRoots.length === 0 ? (
              <div className="rounded-ds-xl border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface-muted)] p-10 text-center text-small text-[var(--ds-text-muted)]">
                Henüz mağazada kategori bulunmuyor.
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {hubRoots.map((row) => {
                  const children = childCategories(row.id);
                  const href = shopBrowseHref({ categoryId: row.id, sort, view });
                  return (
                    <li
                      key={row.id}
                      className="overflow-hidden rounded-ds-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-card"
                    >
                      <Link
                        href={href}
                        prefetch
                        className="block p-5 transition-colors hover:bg-[var(--ds-surface-muted)]"
                      >
                        <p className="text-lg font-semibold tracking-tight text-[var(--ds-text)]">{row.name}</p>
                        {typeof row._count?.products === "number" ? (
                          <p className="mt-1 text-micro text-[var(--ds-text-muted)]">{row._count.products} ürün</p>
                        ) : null}
                      </Link>
                      {children.length > 0 ? (
                        <div className="border-t border-[var(--ds-border)] bg-[var(--ds-surface-muted)]/35 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ds-text-muted)]">
                            Alt kategoriler
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {children.map((ch) => (
                              <li key={ch.id}>
                                <Link
                                  href={shopBrowseHref({ categoryId: ch.id, sort, view })}
                                  prefetch
                                  className="inline-flex rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ds-text)] hover:border-[var(--ds-text-muted)]"
                                >
                                  {ch.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <ShopCatalogGrid
              key={`${catalogQs}|${page}`}
              initial={catalog}
              queryWithoutPage={catalogQs}
              layout={view}
            />
          )}
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
