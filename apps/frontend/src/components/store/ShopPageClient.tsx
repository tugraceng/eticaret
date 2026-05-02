"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, memo } from "react";
import { ShopToolbar } from "@/app/(site)/shop/ShopToolbar";
import { ShopCatalogGrid, type CatalogPayload } from "@/app/(site)/shop/ShopCatalogGrid";

type ShopCategory = { id: string; name: string; slug: string };
export type ShopSortKey = "newest" | "price_asc" | "price_desc" | "popular";

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
  page,
  view,
}: {
  title: string;
  categories: ShopCategory[];
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
  page: number;
  view: "grid" | "list";
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <header className="mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h1 className="text-h1 text-[var(--ds-text)] md:text-display md:text-4xl">{title}</h1>
          <p className="mt-2 text-body text-[var(--ds-text-muted)]">{catalog.total} ürün bulundu</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-2xl">
          <div className="min-w-0 flex-1">
            <ShopToolbar />
          </div>
          <ViewToggle view={view} />
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-8 xl:gap-10">
        <aside className="mb-8 lg:mb-0">
          <form
            key={`${catalogQs}|${page}`}
            method="GET"
            action="/shop"
            className="space-y-3 rounded-ds-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4 shadow-card lg:sticky lg:top-24 lg:z-10"
          >
            <p className="text-h3 text-[var(--ds-text)]">Filtreler</p>
            <select
              name="categoryId"
              defaultValue={categoryId ?? ""}
              className="input-soft min-h-11 w-full !rounded-ds-lg"
              aria-label="Kategori seç"
            >
              <option value="">Tüm kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
              placeholder="Min fiyat (kuruş)"
              className="input-soft min-h-11 w-full !rounded-ds-lg"
            />
            <input
              name="maxPriceCents"
              type="number"
              min={0}
              defaultValue={maxPriceCents ?? ""}
              placeholder="Max fiyat (kuruş)"
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
            {view === "list" ? <input type="hidden" name="view" value="list" /> : null}
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button type="submit" className="btn-primary min-h-11 flex-1">
                Uygula
              </button>
              <Link href="/shop" className="btn-ghost flex min-h-11 flex-1 items-center justify-center">
                Sıfırla
              </Link>
            </div>
          </form>
        </aside>

        <div className="min-w-0">
          <ShopCatalogGrid
            key={`${catalogQs}|${page}`}
            initial={catalog}
            queryWithoutPage={catalogQs}
            layout={view}
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
