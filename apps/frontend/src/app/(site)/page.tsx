import { Fragment, type ReactNode } from "react";
import { HomeSectionRenderer } from "@/components/home/HomeSections";
import type { HomeRenderContext } from "@/components/home/HomeSections";
import { HomeRetailSection } from "@/components/home/HomeRetailSection";
import { RecentlyViewedRail } from "@/components/store/RecentlyViewedRail";
import { apiJson } from "@/lib/api";
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
  try {
    const [plist, clist] = await Promise.all([
      apiJson<ProductCardData[]>(productApiPath(q, categoryId)),
      apiJson<ShopCategory[]>("/categories"),
    ]);
    products = plist;
    categories = clist;
  } catch {
    products = [];
    categories = [];
  }

  type CatalogSlice = { items: ProductCardData[] };
  let popularRail: ProductCardData[] = [];
  let newestRail: ProductCardData[] = [];
  let bestsellerRail: ProductCardData[] = [];
  if (!filtering) {
    try {
      const [pop, neu, best] = await Promise.all([
        apiJson<CatalogSlice>("/products/catalog?sort=popular&limit=10&page=1"),
        apiJson<CatalogSlice>("/products/catalog?sort=newest&limit=10&page=1"),
        apiJson<ProductCardData[]>("/products/bestsellers?limit=10"),
      ]);
      popularRail = pop.items ?? [];
      newestRail = neu.items ?? [];
      bestsellerRail = Array.isArray(best) ? best : [];
    } catch {
      popularRail = [];
      newestRail = [];
      bestsellerRail = [];
    }
  }

  const activeCategory = categoryId
    ? categories.find((c) => c.id === categoryId)?.name
    : undefined;

  const retailProps = {
    q,
    categoryId,
    filtering,
    activeCategoryName: activeCategory,
    products,
    categories,
  };

  const homeCtx: HomeRenderContext = {
    settings,
    categories,
    catalog: {
      bestsellers: bestsellerRail,
      popular: popularRail,
      newest: newestRail,
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
      {!filtering ? streamNodes : null}

      {filtering ? (
        <HomeRetailSection {...retailProps} />
      ) : null}

      {!filtering && <RecentlyViewedRail />}
    </div>
  );
}
