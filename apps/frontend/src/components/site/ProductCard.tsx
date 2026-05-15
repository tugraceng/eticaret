import Link from "next/link";
import Image from "next/image";
import { memo, type JSX } from "react";
import { WishlistButton } from "@/app/(site)/shop/[slug]/ui";
import { apiAssetUrl } from "@/lib/api";
import { ProductCardAddToCart } from "@/components/site/ProductCardAddToCart";

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
  isFeatured?: boolean;
  isNew?: boolean;
};

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
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

function ProductCardInner({ product }: { product: ProductCardData }) {
  const cover = apiAssetUrl(product.images?.[0]?.url) ?? undefined;
  const second = apiAssetUrl(product.images?.[1]?.url) ?? undefined;
  const alt = product.images?.[0]?.alt ?? product.name;
  const alt2 = product.images?.[1]?.alt ?? alt;
  const onSale =
    typeof product.compareAtCents === "number" && product.compareAtCents > product.priceCents;
  const discount = onSale
    ? Math.round(((product.compareAtCents! - product.priceCents) / product.compareAtCents!) * 100)
    : 0;

  return (
    <div className="group fade-up relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.12)] transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_56px_-28px_rgba(15,23,42,0.22)]">
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className="absolute inset-0 z-[1] rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2"
        aria-label={`${product.name} — ürüne git`}
      />

      <div className="pointer-events-none relative z-[2] flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          {second ? (
            <div className="absolute inset-0 z-[1]" role="img" aria-hidden>
              <Image
                src={second}
                alt={alt2}
                fill
                className="object-cover opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
          ) : null}
          {cover ? (
            <div
              className={`absolute inset-0 z-[2] ${second ? "transition-opacity duration-500 group-hover:opacity-0" : ""}`}
              role="img"
              aria-label={alt}
            >
              <Image
                src={cover}
                alt={alt}
                fill
                className={`object-cover ${second ? "transition-transform duration-500 ease-out group-hover:scale-[1.02]" : "transition-transform duration-500 ease-out group-hover:scale-[1.04]"}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 z-[2] grid place-items-center text-xs text-slate-400">Görsel yok</div>
          )}

          <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="absolute left-3 top-3 z-[4] flex max-w-[70%] flex-col gap-1.5">
            {onSale && (
              <span className="w-fit rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                %{discount} indirim
              </span>
            )}
            {product.isFeatured ? (
              <span className="w-fit rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                Öne çıkan
              </span>
            ) : null}
            {product.isNew ? (
              <span className="w-fit rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                Yeni
              </span>
            ) : null}
          </div>
          {product.category && (
            <span className="absolute right-3 top-3 z-[4] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 backdrop-blur">
              {product.category.name}
            </span>
          )}
          <div className="pointer-events-auto absolute bottom-3 right-3 z-[5]">
            <WishlistButton
              productId={product.id}
              slug={product.slug}
              title={product.name}
              priceCents={product.priceCents}
              imageUrl={cover}
              size="sm"
            />
          </div>

          <span className="absolute inset-x-4 bottom-4 z-[4] translate-y-4 rounded-full bg-slate-900 py-2 text-center text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-500 ease-smooth group-hover:translate-y-0 group-hover:opacity-100">
            Hızlı incele →
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <div className="flex min-h-0 flex-1 flex-col">
            <p className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-sky-800">
              {product.name}
            </p>
            <div className="mt-1.5 min-h-[2.75rem]">
              {product.description ? (
                <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>
              ) : null}
            </div>
            <div className="mt-2 min-h-[1.375rem]">
              {typeof product.reviewCount === "number" && product.reviewCount > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Stars value={product.avgRating ?? 0} />
                  <span>
                    {(product.avgRating ?? 0).toFixed(1)} ({product.reviewCount})
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-base font-semibold text-slate-900">{priceFmt(product.priceCents)}</p>
              {onSale && (
                <p className="text-xs text-slate-400 line-through">{priceFmt(product.compareAtCents!)}</p>
              )}
            </div>
            <div className="pointer-events-auto relative z-[6] w-full">
              <ProductCardAddToCart
                productId={product.id}
                slug={product.slug}
                title={product.name}
                priceCents={product.priceCents}
                imageUrl={cover}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardInner);
ProductCard.displayName = "ProductCard";
