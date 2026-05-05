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
  const fallbackRail = { title: "Öne çıkan seri", href: "/shop", products: products.slice(0, 5) };

  if (filtering) {
    const title = activeCategoryName
      ? activeCategoryName
      : q
        ? `"${q}" için sonuçlar`
        : "Sonuçlar";
    return (
      <section
        id="urunler"
        className="home-retail mx-auto w-full max-w-6xl px-3 py-10 sm:px-6 sm:py-14 md:py-16"
      >
        <div className="section-shell">
          <div
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-50/70 to-transparent"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="fade-up min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">
                Sonuçlar
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-2 sm:text-3xl md:text-4xl">
                {title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
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
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/90 p-8 text-center">
            <p className="text-base font-semibold text-slate-900">Henüz ürün eklenmedi</p>
            <p className="mt-2 text-sm text-slate-600">Admin panelinden ürün ekleyip tekrar deneyin.</p>
            <p className="mt-1 text-xs text-slate-500">Kategori ekleyin ve ürünleri kategorilere bağlayın.</p>
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
    <div className="home-retail bg-white">
      <section id="urunler" className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 md:px-12 lg:px-16">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
            Öne çıkan
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-neutral-900 md:text-3xl">
            Öne çıkan seri
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-500">
            Atölyemizde bastığımız ürünlerden seçtiklerimiz. Tüm modeller için{" "}
            <Link href="/shop" className="font-medium text-neutral-800 underline-offset-2 hover:underline">
              mağazaya
            </Link>{" "}
            göz atın.
          </p>
        </div>

        <div className="mt-12">
          {isEmpty ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-xl font-semibold text-slate-900">Henüz ürün eklenmedi</p>
              <p className="mt-2 text-sm text-slate-600">Vitrin boş görünüyor. Admin panelinden ürün ekleyin.</p>
              <p className="mt-1 text-sm text-slate-500">Kategori ekleyin ve ürünlerinizi yayınlayın.</p>
            </div>
          ) : (
            <HomeEditorialProductGrid products={products} />
          )}
        </div>
      </section>
    </div>
  );
}
