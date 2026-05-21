"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, type JSX } from "react";
import { WishlistButton } from "@/app/(site)/shop/[slug]/ui";
import { apiAssetUrl } from "@/lib/api";
import { ProductCardAddToCart } from "@/components/site/ProductCardAddToCart";
import { cn } from "@/lib/cn";
import { trackProductLinkClick } from "@/lib/product-link-click";
import { seoExcerpt } from "@/lib/seo";

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

type ProductCardProps = {
  product: ProductCardData;
  /** Kategori sayfasında tekrarlayan etiket gösterme */
  showCategory?: boolean;
  /** Izgara modunda kısa açıklama */
  showDescription?: boolean;
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

function ProductCardInner({ product, showCategory = false, showDescription = false }: ProductCardProps) {
  const excerpt =
    showDescription && product.description?.trim()
      ? seoExcerpt(product.description.trim(), 100)
      : null;
  const cover = apiAssetUrl(product.images?.[0]?.url) ?? undefined;
  const second = apiAssetUrl(product.images?.[1]?.url) ?? undefined;
  const alt = product.images?.[0]?.alt ?? product.name;
  const alt2 = product.images?.[1]?.alt ?? alt;
  const onSale =
    typeof product.compareAtCents === "number" && product.compareAtCents > product.priceCents;
  const discount = onSale
    ? Math.round(((product.compareAtCents! - product.priceCents) / product.compareAtCents!) * 100)
    : 0;
  const hasReviews = typeof product.reviewCount === "number" && product.reviewCount > 0;

  const badges: { key: string; node: JSX.Element }[] = [];
  if (onSale) {
    badges.push({
      key: "sale",
      node: (
        <span className="rounded bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
          %{discount}
        </span>
      ),
    });
  } else if (product.isNew) {
    badges.push({
      key: "new",
      node: (
        <span className="rounded border border-emerald-500/35 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-200">
          Yeni
        </span>
      ),
    });
  } else if (product.isFeatured) {
    badges.push({
      key: "feat",
      node: (
        <span className="rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-200">
          Öne çıkan
        </span>
      ),
    });
  }

  const productHref = `/shop/${product.slug}`;

  return (
    <article className="si-product-card group fade-up relative flex h-full w-full flex-col">
      <Link
        prefetch={false}
        href={productHref}
        className="absolute inset-0 z-[1] rounded-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2736]"
        aria-label={`${product.name} — ürüne git`}
        onClick={() => trackProductLinkClick(product.slug)}
      />

      <div className="relative z-[2] flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className="si-product-card-media shrink-0">
          {second ? (
            <div className="absolute inset-0 z-[1]" role="img" aria-hidden>
              <Image
                src={second}
                alt={alt2}
                fill
                quality={55}
                className="object-cover object-center opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 z-[2] grid place-items-center text-xs text-slate-500">
              Görsel yok
            </div>
          )}

          {badges.length > 0 ? (
            <div className="absolute left-2.5 top-2.5 z-[4] flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
              {badges.map((b) => (
                <span key={b.key}>{b.node}</span>
              ))}
            </div>
          ) : null}

          {showCategory && product.category ? (
            <span className="absolute right-2.5 top-2.5 z-[4] max-w-[45%] truncate rounded border border-white/10 bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 backdrop-blur-sm">
              {product.category.name}
            </span>
          ) : null}

          <div className="pointer-events-auto absolute bottom-2.5 right-2.5 z-[5]">
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

        <div className="si-product-card-body flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5">
          <p className="si-product-name line-clamp-2 min-h-[2.5rem]">
            <span className="pointer-events-none">{product.name}</span>
          </p>
          {excerpt ? (
            <p className="si-product-excerpt pointer-events-none mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-snug text-slate-500">
              {excerpt}
            </p>
          ) : null}

          <div className={cn("flex h-5 items-center gap-1.5", excerpt ? "mt-1.5" : "mt-2")}>
            {hasReviews ? (
              <>
                <Stars value={product.avgRating ?? 0} />
                <span className="text-xs text-slate-500">
                  {(product.avgRating ?? 0).toFixed(1)}
                </span>
              </>
            ) : (
              <span className="block h-5" aria-hidden />
            )}
          </div>

          <div className="si-product-card-footer mt-auto shrink-0 border-t border-white/[0.06] pt-3">
            <div className="min-w-0">
              <p className="si-price leading-tight">{priceFmt(product.priceCents)}</p>
              <p
                className={cn(
                  "text-xs leading-tight text-slate-500 line-through",
                  onSale ? "visible" : "invisible",
                )}
              >
                {onSale ? priceFmt(product.compareAtCents!) : "—"}
              </p>
            </div>
            <div className="si-product-card-atc pointer-events-auto relative z-[6] w-full">
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
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
ProductCard.displayName = "ProductCard";
