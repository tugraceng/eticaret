import Link from "next/link";
import { Suspense } from "react";
import type { ProductCardData } from "@/components/site/ProductCard";
import { CategoryStrip, type ShopCategory } from "@/app/(site)/shop/CategoryStrip";
import { ShopToolbar } from "@/app/(site)/shop/ShopToolbar";
import { HomeEditorialProductGrid } from "./HomeEditorialProductGrid";
import { HomeProductRail } from "./HomeProductRail";

type Props = {
  q?: string;
  categoryId?: string;
  filtering: boolean;
  activeCategoryName?: string;
  products: ProductCardData[];
  categories: ShopCategory[];
};

export function HomeRetailSection({
  q,
  categoryId,
  filtering,
  activeCategoryName,
  products,
  categories,
}: Props) {
  const isEmpty = products.length === 0;
  const rails = categories.slice(0, 2).map((c) => ({
    title: c.name,
    href: `/shop?categoryId=${encodeURIComponent(c.id)}`,
    products: products.filter((p) => p.category?.slug === c.slug).slice(0, 5),
  }));
  const firstShopCategory = categories[0];
  const fallbackRail = {
    title: "Öne çıkan seri",
    href: firstShopCategory
      ? `/shop?categoryId=${encodeURIComponent(firstShopCategory.id)}`
      : "/shop",
    products: products.slice(0, 5),
  };

  if (filtering) {
    const title = activeCategoryName
      ? activeCategoryName
      : q
        ? `"${q}" için sonuçlar`
        : "Sonuçlar";
    return (
      <section
        id="urunler"
        className="home-retail mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:py-16"
      >
        <div className="section-shell">
          <div
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-50/70 to-transparent"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="fade-up min-w-0">
              <p className="si-kicker">Sonuçlar</p>
              <h2 className="si-heading mt-2 text-2xl sm:text-3xl">{title}</h2>
              <p className="si-body mt-2 max-w-xl">
                {`${products.length} ürün listeleniyor.`}
              </p>
            </div>
            <div className="w-full shrink-0 md:max-w-md md:self-end">
              <Suspense
                fallback={<div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 md:max-w-md" />}
              >
                <ShopToolbar />
              </Suspense>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-7 md:mt-9">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Kategoriler</h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Listeyi daraltmak için bir kategori seçin.</p>
            <div className="mt-3">
              <CategoryStrip categories={categories} activeCategoryId={categoryId} activeQ={q} />
            </div>
          </div>
        )}

        {isEmpty ? (
          <div className="si-page-card mt-8 rounded-2xl border border-dashed p-8 text-center">
            <p className="text-base font-semibold text-slate-100">Henüz ürün eklenmedi</p>
            <p className="si-body mt-2">Admin panelinden ürün ekleyip tekrar deneyin.</p>
          </div>
        ) : null}

        {(rails.length ? rails : [fallbackRail]).map((rail) => (
          <section key={rail.title} className="mt-8">
            <HomeProductRail title={rail.title} href={rail.href} products={rail.products} />
          </section>
        ))}
      </section>
    );
  }

  return (
    <div className="home-retail si-section">
      <section id="urunler" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="si-kicker">Öne çıkan</p>
          <h2 className="si-heading mt-2">Öne çıkan seri</h2>
          <p className="si-body mx-auto mt-3 max-w-lg">
            Atölyemizde bastığımız ürünlerden seçtiklerimiz. Tüm modeller için{" "}
            <Link href="/shop" className="font-medium text-sky-400/90 hover:text-sky-300 hover:underline">
              mağazaya
            </Link>{" "}
            göz atın.
          </p>
        </div>

        <div className="mt-10 sm:mt-12">
          {isEmpty ? (
            <div className="si-page-card rounded-2xl border border-dashed p-10 text-center">
              <p className="text-lg font-semibold text-slate-100">Öne çıkan ürün yok</p>
              <p className="si-body mt-2">
                Bu alanda yalnızca ürün kartında «Öne çıkan» işaretli yayında ürünler gösterilir. İsterseniz{" "}
                <Link href="/shop" className="font-medium text-sky-400/90 hover:text-sky-300 hover:underline">
                  mağazadaki
                </Link>{" "}
                tüm modellere göz atın.
              </p>
            </div>
          ) : (
            <HomeEditorialProductGrid products={products} />
          )}
        </div>
      </section>
    </div>
  );
}
