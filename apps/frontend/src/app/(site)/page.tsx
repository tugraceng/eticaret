import { Fragment, type ReactNode } from "react";
import { HomeSectionRenderer } from "@/components/home/HomeSections";
import type { HomeRenderContext } from "@/components/home/HomeSections";
import { HomeRetailSection } from "@/components/home/HomeRetailSection";
import { RecentlyViewedRail } from "@/components/store/RecentlyViewedRail";
import { apiJsonSafe } from "@/lib/api";
import { IMPLICIT_RETAIL_BEFORE_KINDS } from "@/lib/homeLayout";
import { getHomeSections, getSiteSettings } from "@/lib/settings";
import type { ProductCardData } from "@/components/site/ProductCard";
import type { ShopCategory } from "./shop/CategoryStrip";

export const dynamic = "force-dynamic";

function productApiPath(q?: string, categoryId?: string) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (categoryId) p.set("categoryId", categoryId);
  const s = p.toString();
  return s ? `/products?${s}` : "/products";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categoryId = sp.categoryId?.trim();
  const filtering = Boolean(q || categoryId);

  const [allSections, settings] = await Promise.all([getHomeSections(), getSiteSettings()]);
  const visible = allSections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));

  let products: ProductCardData[] = [];
  let categories: ShopCategory[] = [];
  const [plist, clist] = await Promise.all([
    filtering ? apiJsonSafe<ProductCardData[]>(productApiPath(q, categoryId)) : Promise.resolve(null),
    apiJsonSafe<ShopCategory[]>("/categories"),
  ]);
  products = Array.isArray(plist) ? plist : [];
  categories = Array.isArray(clist) ? clist : [];

  type CatalogSlice = { items: ProductCardData[] };
  let popularRail: ProductCardData[] = [];
  let newestRail: ProductCardData[] = [];
  let bestsellerRail: ProductCardData[] = [];
  let featuredRail: ProductCardData[] = [];
  if (!filtering) {
    const [pop, neu, best, feat] = await Promise.all([
      apiJsonSafe<CatalogSlice>("/products/catalog?sort=popular&limit=10&page=1"),
      apiJsonSafe<CatalogSlice>("/products/catalog?sort=newest&limit=10&page=1"),
      apiJsonSafe<ProductCardData[]>("/products/bestsellers?limit=10"),
      apiJsonSafe<ProductCardData[]>("/products?featured=1"),
    ]);
    popularRail = pop?.items ?? [];
    newestRail = neu?.items ?? [];
    bestsellerRail = Array.isArray(best) ? best : [];
    featuredRail = Array.isArray(feat) ? feat : [];
  }

  const activeCategory = categoryId
    ? categories.find((c) => c.id === categoryId)?.name
    : undefined;

  const retailProps = {
    q,
    categoryId,
    filtering,
    activeCategoryName: activeCategory,
    /** Vitrin modunda yalnızca «Öne çıkan» işaretli yayınlı ürünler (güncelleme sırasına göre tüm liste karışmasın). */
    products: filtering ? products : featuredRail,
    categories,
  };

  const homeCtx: HomeRenderContext = {
    settings,
    categories,
    catalog: {
      bestsellers: bestsellerRail,
      popular: popularRail,
      newest: newestRail,
      featured: featuredRail,
    },
  };

  const hasExplicitCatalog = visible.some((s) => s.kind === "PRODUCT_CATALOG");
  const streamNodes: ReactNode[] = [];
  let catalogRendered = false;

  if (!filtering) {
    for (const s of visible) {
      if (
        !hasExplicitCatalog &&
        !catalogRendered &&
        IMPLICIT_RETAIL_BEFORE_KINDS.has(s.kind)
      ) {
        catalogRendered = true;
        streamNodes.push(
          <HomeRetailSection key="home-retail-implicit" {...retailProps} />,
        );
      }
      if (s.kind === "PRODUCT_CATALOG") {
        if (!catalogRendered) {
          catalogRendered = true;
          streamNodes.push(<HomeRetailSection key={s.id} {...retailProps} />);
        }
        continue;
      }
      const sectionNode = await HomeSectionRenderer({ section: s, ctx: homeCtx });
      if (sectionNode != null) {
        streamNodes.push(<Fragment key={s.id}>{sectionNode}</Fragment>);
      }
    }
    if (!catalogRendered) {
      streamNodes.push(<HomeRetailSection key="home-retail-fallback" {...retailProps} />);
    }
  }

  return (
    <div className="home-page flex flex-col">
      {!filtering && visible.length === 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-2xl font-semibold text-slate-900">Henüz vitrin içeriği eklenmedi</p>
            <p className="mt-2 text-sm text-slate-600">
              Admin panelden hero, kategori ve ürün ekleyin.
            </p>
          </div>
        </section>
      ) : null}
      {!filtering ? streamNodes : null}

      {filtering ? (
        <HomeRetailSection {...retailProps} />
      ) : null}

      {!filtering && <RecentlyViewedRail />}
    </div>
  );
}
