import Link from "next/link";
import Image from "next/image";
import type { JSX } from "react";
import { WishlistButton } from "@/app/(site)/shop/[slug]/ui";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  priceCents: number;
  compareAtCents?: number | null;
  images?: { url: string; alt?: string | null }[];
  category?: { name: string; slug: string } | null;
  avgRating?: number;
  reviewCount?: number;
};

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2; // 0, 0.5, 1, ...
  const nodes = [] as JSX.Element[];
  for (let i = 1; i <= 5; i++) {
    const fill = i <= rounded ? 1 : i - 0.5 === rounded ? 0.5 : 0;
    nodes.push(
      <span key={i} className="relative inline-block h-3.5 w-3.5 text-slate-300">
        <svg viewBox="0 0 20 20" className="absolute inset-0 h-full w-full" fill="currentColor">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.572-.955L10 0l2.938 5.955 6.572.955-4.755 4.635 1.123 6.545z" />
        </svg>
        {fill > 0 ? (
          <span
            className="absolute inset-0 overflow-hidden text-amber-400"
            style={{ width: `${fill * 100}%` }}
          >
            <svg viewBox="0 0 20 20" className="h-full w-auto" fill="currentColor" preserveAspectRatio="xMinYMid meet">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.572-.955L10 0l2.938 5.955 6.572.955-4.755 4.635 1.123 6.545z" />
            </svg>
          </span>
        ) : null}
      </span>,
    );
  }
  return <span className="inline-flex items-center gap-0.5">{nodes}</span>;
}

function priceFmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const cover = product.images?.[0]?.url;
  const alt = product.images?.[0]?.alt ?? product.name;
  const onSale =
    typeof product.compareAtCents === "number" && product.compareAtCents > product.priceCents;
  const discount = onSale
    ? Math.round(((product.compareAtCents! - product.priceCents) / product.compareAtCents!) * 100)
    : 0;

  return (
    <div className="group card-soft fade-up relative flex flex-col overflow-hidden">
      {/*
        Link + button iç içe geçersiz HTML; tam kart tıklaması için görünmez Link,
        metin/görsel üstünde pointer-events-none, favori alanı pointer-events-auto.
      */}
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className="absolute inset-0 z-[1] rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
        aria-label={`${product.name} — ürüne git`}
      />

      <div className="pointer-events-none relative z-[2] flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          {cover ? (
            <div className="absolute inset-0" role="img" aria-label={alt}>
              <Image
                src={cover}
                alt={alt}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
              Görsel yok
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {onSale && (
            <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              %{discount} indirim
            </span>
          )}
          {product.category && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 backdrop-blur">
              {product.category.name}
            </span>
          )}
          <div className="pointer-events-auto absolute bottom-3 right-3 z-[3]">
            <WishlistButton
              productId={product.id}
              slug={product.slug}
              title={product.name}
              priceCents={product.priceCents}
              imageUrl={cover}
              size="sm"
            />
          </div>

          <span className="absolute inset-x-4 bottom-4 translate-y-4 rounded-full bg-slate-900 py-2 text-center text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-500 ease-smooth group-hover:translate-y-0 group-hover:opacity-100">
            Hızlı incele →
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-sky-800">
            {product.name}
          </p>
          {product.description && (
            <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-500">{product.description}</p>
          )}
          {typeof product.reviewCount === "number" && product.reviewCount > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Stars value={product.avgRating ?? 0} />
              <span>
                {(product.avgRating ?? 0).toFixed(1)} ({product.reviewCount})
              </span>
            </div>
          ) : null}
          <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-4">
            <div>
              <p className="text-base font-semibold text-slate-900">{priceFmt(product.priceCents)}</p>
              {onSale && (
                <p className="text-xs text-slate-400 line-through">
                  {priceFmt(product.compareAtCents!)}
                </p>
              )}
            </div>
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 transition-all duration-300 ease-spring group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-[-8deg]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
