import Link from "next/link";
import Image from "next/image";
import { memo, type JSX } from "react";
import { WishlistButton } from "@/app/(site)/shop/[slug]/ui";
import { apiAssetUrl } from "@/lib/api";
import { ProductCardAddToCart } from "@/components/site/ProductCardAddToCart";
import { cn } from "@/lib/cn";

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
      <span key={i} className="relative inline-block h-3.5 w-3.5 text-slate-600">
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
    <div className="si-product-card group fade-up relative">
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className="absolute inset-0 z-[1] rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141d2e]"
        aria-label={`${product.name} — ürüne git`}
      />

      <div className="pointer-events-none relative z-[2] flex min-h-0 flex-1 flex-col">
        <div className="si-product-card-media">
          {second ? (
            <div className="absolute inset-0 z-[1]" role="img" aria-hidden>
              <Image
                src={second}
                alt={alt2}
                fill
                quality={55}
                className="object-cover object-center opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>
          ) : null}
          {cover ? (
            <div
              className={cn(
                "absolute inset-0 z-[2]",
                second && "transition-opacity duration-500 group-hover:opacity-0",
              )}
              role="img"
              aria-label={alt}
            >
              <Image
                src={cover}
                alt={alt}
                fill
                quality={80}
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 z-[2] grid place-items-center text-xs text-slate-500">
              Görsel yok
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/3 bg-gradient-to-t from-[#141d2e] to-transparent opacity-80" />

          <div className="absolute left-3 top-3 z-[4] flex max-w-[70%] flex-col gap-1.5">
            {onSale ? (
              <span className="w-fit rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                %{discount}
              </span>
            ) : null}
            {product.isFeatured ? (
              <span className="w-fit rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                Öne çıkan
              </span>
            ) : null}
            {product.isNew ? (
              <span className="w-fit rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Yeni
              </span>
            ) : null}
          </div>
          {product.category ? (
            <span className="absolute right-3 top-3 z-[4] rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
              {product.category.name}
            </span>
          ) : null}
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
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
          <p className="si-product-name line-clamp-2 transition-colors group-hover:text-white">
            {product.name}
          </p>
          {typeof product.reviewCount === "number" && product.reviewCount > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Stars value={product.avgRating ?? 0} />
              <span>
                {(product.avgRating ?? 0).toFixed(1)} ({product.reviewCount})
              </span>
            </div>
          ) : (
            <div className="mt-2 min-h-[1.25rem]" aria-hidden />
          )}
          <div className="mt-auto flex shrink-0 items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
            <div>
              <p className="si-price">{priceFmt(product.priceCents)}</p>
              {onSale ? (
                <p className="text-xs text-slate-500 line-through">{priceFmt(product.compareAtCents!)}</p>
              ) : null}
            </div>
            <div className="pointer-events-auto relative z-[6] shrink-0">
              <ProductCardAddToCart
                productId={product.id}
                slug={product.slug}
                title={product.name}
                priceCents={product.priceCents}
                imageUrl={cover}
                variant="icon"
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
