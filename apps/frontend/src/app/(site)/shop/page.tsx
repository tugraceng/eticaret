import { apiJson } from "@/lib/api";
import type { CatalogPayload } from "./ShopCatalogGrid";
import { ShopPageClient } from "@/components/store/ShopPageClient";

export const dynamic = "force-dynamic";

type ShopCategory = { id: string; name: string; slug: string };
type SortKey = "newest" | "price_asc" | "price_desc" | "popular";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "En yeni" },
  { key: "popular", label: "Popüler" },
  { key: "price_asc", label: "Fiyat (artan)" },
  { key: "price_desc", label: "Fiyat (azalan)" },
];

function asPositiveInt(v?: string) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

function asMinAvgRating(v?: string): string | undefined {
  if (v === "4" || v === "3" || v === "2") return v;
  return undefined;
}

function buildCatalogQueryString(args: {
  q?: string;
  categoryId?: string;
  sort: SortKey;
  minPriceCents?: number;
  maxPriceCents?: number;
  minAvgRating?: string;
  inStockOnly: boolean;
}) {
  const p = new URLSearchParams();
  p.set("limit", "12");
  if (args.q?.trim()) p.set("q", args.q.trim());
  if (args.categoryId?.trim()) p.set("categoryId", args.categoryId.trim());
  p.set("sort", args.sort);
  if (typeof args.minPriceCents === "number") p.set("minPriceCents", String(args.minPriceCents));
  if (typeof args.maxPriceCents === "number") p.set("maxPriceCents", String(args.maxPriceCents));
  if (args.minAvgRating) p.set("minAvgRating", args.minAvgRating);
  if (args.inStockOnly) p.set("inStock", "1");
  return p.toString();
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    sort?: SortKey;
    minPriceCents?: string;
    maxPriceCents?: string;
    minAvgRating?: string;
    page?: string;
    inStock?: string;
    view?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categoryId = sp.categoryId?.trim();
  const sort = SORTS.some((s) => s.key === sp.sort) ? (sp.sort as SortKey) : "newest";
  const minPriceCents = asPositiveInt(sp.minPriceCents);
  const maxPriceCents = asPositiveInt(sp.maxPriceCents);
  const minAvgRating = asMinAvgRating(sp.minAvgRating?.trim());
  const page = asPositiveInt(sp.page) ?? 1;
  const inStockOnly = sp.inStock === "1";
  const view: "grid" | "list" = sp.view === "list" ? "list" : "grid";

  const catalogQs = buildCatalogQueryString({
    q,
    categoryId,
    sort,
    minPriceCents,
    maxPriceCents,
    minAvgRating,
    inStockOnly,
  });

  const [categories, catalog] = await Promise.all([
    apiJson<ShopCategory[]>("/categories"),
    apiJson<CatalogPayload>(`/products/catalog?${catalogQs}&page=${page}`),
  ]);

  const titleBits = [
    q ? `"${q}"` : null,
    categoryId ? categories.find((c) => c.id === categoryId)?.name ?? "Kategori" : null,
  ].filter(Boolean);
  const title = titleBits.length ? `${titleBits.join(" · ")} sonuçları` : "Tüm ürünler";

  const baseParams = {
    q,
    categoryId,
    sort,
    minPriceCents: minPriceCents ? String(minPriceCents) : undefined,
    maxPriceCents: maxPriceCents ? String(maxPriceCents) : undefined,
    minAvgRating,
    ...(inStockOnly ? { inStock: "1" as const } : {}),
    ...(view === "list" ? { view: "list" as const } : {}),
  };

  return (
    <ShopPageClient
      title={title}
      categories={categories}
      catalog={catalog}
      catalogQs={catalogQs}
      baseParams={baseParams}
      q={q}
      categoryId={categoryId}
      sort={sort}
      sorts={SORTS}
      minPriceCents={minPriceCents}
      maxPriceCents={maxPriceCents}
      minAvgRating={minAvgRating}
      inStockOnly={inStockOnly}
      page={page}
      view={view}
    />
  );
}
