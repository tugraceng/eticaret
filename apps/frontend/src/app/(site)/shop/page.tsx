import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/api";
import type { CategoryApiRow } from "@/lib/category-nav";
import { getSiteSettings } from "@/lib/settings";
import { buildPageMetadata, seoExcerpt } from "@/lib/seo";
import type { CatalogPayload } from "./ShopCatalogGrid";
import { ShopPageClient } from "@/components/store/ShopPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; categoryId?: string; q?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const settings = await getSiteSettings();
  const categories = await apiJson<CategoryApiRow[]>("/categories").catch(() => [] as CategoryApiRow[]);
  const categorySlug = sp.category?.trim();
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : sp.categoryId?.trim()
      ? categories.find((c) => c.id === sp.categoryId?.trim())
      : undefined;

  if (category) {
    const desc =
      category.metaDescription?.trim() ||
      category.description?.trim() ||
      `${category.name} kategorisindeki ürünleri keşfedin.`;
    return buildPageMetadata({
      title: category.metaTitle?.trim() || category.name,
      description: seoExcerpt(desc),
      path: `/shop?category=${encodeURIComponent(category.slug)}`,
      siteOgImage: settings.shopOgImageUrl ?? settings.ogImageUrl,
      fields: {
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        seoKeywords: category.seoKeywords,
        seoCanonicalUrl: category.seoCanonicalUrl,
        seoOgImageUrl: category.seoOgImageUrl,
        seoNoIndex: category.seoNoIndex,
      },
    });
  }

  const siteName = settings.siteName;
  return buildPageMetadata({
    title: settings.shopMetaTitle?.trim() || `Mağaza · ${siteName}`,
    description: seoExcerpt(
      settings.shopMetaDesc?.trim() ||
        settings.defaultMetaDesc?.trim() ||
        `${siteName} ürün kataloğu.`,
    ),
    path: "/shop",
    siteOgImage: settings.shopOgImageUrl ?? settings.ogImageUrl,
    fields: {
      metaTitle: settings.shopMetaTitle,
      metaDescription: settings.shopMetaDesc,
      seoKeywords: settings.shopSeoKeywords,
      seoCanonicalUrl: settings.shopCanonicalUrl,
      seoOgImageUrl: settings.shopOgImageUrl,
      seoNoIndex: settings.shopNoIndex,
    },
  });
}
type SortKey = "newest" | "price_asc" | "price_desc" | "popular" | "bestseller";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "En yeni" },
  { key: "bestseller", label: "En çok satan" },
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

/** Eski ?categoryId= linklerini slug'a çevirirken filtre parametrelerini korur. */
function appendShopFilterParams(
  sp: {
    sort?: string;
    minPriceCents?: string;
    maxPriceCents?: string;
    minAvgRating?: string;
    page?: string;
    inStock?: string;
    onSale?: string;
    featured?: string;
    newProduct?: string;
    view?: string;
  },
  p: URLSearchParams,
) {
  if (sp.sort) p.set("sort", sp.sort);
  if (sp.minPriceCents) p.set("minPriceCents", sp.minPriceCents);
  if (sp.maxPriceCents) p.set("maxPriceCents", sp.maxPriceCents);
  if (sp.minAvgRating) p.set("minAvgRating", sp.minAvgRating);
  if (sp.inStock === "1") p.set("inStock", "1");
  if (sp.onSale === "1") p.set("onSale", "1");
  if (sp.featured === "1") p.set("featured", "1");
  if (sp.newProduct === "1") p.set("newProduct", "1");
  if (sp.view === "list") p.set("view", "list");
  if (sp.page && sp.page !== "1") p.set("page", sp.page);
}

function buildCatalogQueryString(args: {
  q?: string;
  categoryId?: string;
  sort: SortKey;
  minPriceCents?: number;
  maxPriceCents?: number;
  minAvgRating?: string;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  featuredOnly: boolean;
  newOnly: boolean;
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
  if (args.onSaleOnly) p.set("onSale", "1");
  if (args.featuredOnly) p.set("featured", "1");
  if (args.newOnly) p.set("newProduct", "1");
  return p.toString();
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    categoryId?: string;
    sort?: SortKey;
    minPriceCents?: string;
    maxPriceCents?: string;
    minAvgRating?: string;
    page?: string;
    inStock?: string;
    onSale?: string;
    featured?: string;
    newProduct?: string;
    view?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categorySlugParam = sp.category?.trim();
  let categoryId = sp.categoryId?.trim();

  const categoriesEarly = await apiJson<CategoryApiRow[]>("/categories");
  if (categorySlugParam) {
    categoryId = categoriesEarly.find((c) => c.slug === categorySlugParam)?.id ?? categoryId;
  } else if (categoryId) {
    const byId = categoriesEarly.find((c) => c.id === categoryId);
    if (byId) {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      p.set("category", byId.slug);
      appendShopFilterParams(sp, p);
      redirect(`/shop?${p.toString()}`);
    }
  }
  const sort = SORTS.some((s) => s.key === sp.sort) ? (sp.sort as SortKey) : "newest";
  const minPriceCents = asPositiveInt(sp.minPriceCents);
  const maxPriceCents = asPositiveInt(sp.maxPriceCents);
  const minAvgRating = asMinAvgRating(sp.minAvgRating?.trim());
  const page = asPositiveInt(sp.page) ?? 1;
  const inStockOnly = sp.inStock === "1";
  const onSaleOnly = sp.onSale === "1";
  const featuredOnly = sp.featured === "1";
  const newOnly = sp.newProduct === "1";
  const view: "grid" | "list" = sp.view === "list" ? "list" : "grid";

  const catalogQs = buildCatalogQueryString({
    q,
    categoryId,
    sort,
    minPriceCents,
    maxPriceCents,
    minAvgRating,
    inStockOnly,
    onSaleOnly,
    featuredOnly,
    newOnly,
  });

  const catalog = await apiJson<CatalogPayload>(`/products/catalog?${catalogQs}&page=${page}`);
  const categories = categoriesEarly;

  const titleBits = [
    q ? `"${q}"` : null,
    categoryId ? categories.find((c) => c.id === categoryId)?.name ?? "Kategori" : null,
  ].filter(Boolean);
  const title = titleBits.length ? titleBits.join(" · ") : "Mağaza";

  const hasActiveCatalogFilters = Boolean(
    q ||
      categoryId ||
      minPriceCents != null ||
      maxPriceCents != null ||
      minAvgRating ||
      inStockOnly ||
      onSaleOnly ||
      featuredOnly ||
      newOnly ||
      sort !== "newest",
  );

  const activeCategory = categoryId ? categories.find((c) => c.id === categoryId) ?? null : null;

  const baseParams = {
    q,
    category: activeCategory?.slug,
    sort,
    minPriceCents: minPriceCents ? String(minPriceCents) : undefined,
    maxPriceCents: maxPriceCents ? String(maxPriceCents) : undefined,
    minAvgRating,
    ...(inStockOnly ? { inStock: "1" as const } : {}),
    ...(onSaleOnly ? { onSale: "1" as const } : {}),
    ...(featuredOnly ? { featured: "1" as const } : {}),
    ...(newOnly ? { newProduct: "1" as const } : {}),
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
      sort={sort}
      sorts={SORTS}
      minPriceCents={minPriceCents}
      maxPriceCents={maxPriceCents}
      minAvgRating={minAvgRating}
      inStockOnly={inStockOnly}
      onSaleOnly={onSaleOnly}
      featuredOnly={featuredOnly}
      newOnly={newOnly}
      page={page}
      view={view}
      hasActiveCatalogFilters={hasActiveCatalogFilters}
      activeCategory={activeCategory}
    />
  );
}
