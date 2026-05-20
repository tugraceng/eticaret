"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import type { ProductCardData } from "@/components/site/ProductCard";
import { ProductInlineCartQty } from "@/components/site/ProductInlineCartQty";
import { apiAssetUrl } from "@/lib/api";
import { trackProductLinkClick } from "@/lib/product-link-click";

type Props = { product: ProductCardData };

function priceFmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export const ProductListRow = memo(function ProductListRow({ product }: Props) {
  const cover = apiAssetUrl(product.images?.[0]?.url) ?? undefined;
  const alt = product.images?.[0]?.alt ?? product.name;

  return (
    <li className="si-shop-list-row flex gap-4 rounded-ds-xl p-4">
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-ds-lg bg-[var(--ds-surface-muted)] sm:h-28 sm:w-28"
        onClick={() => trackProductLinkClick(product.slug)}
      >
        {cover ? (
          <Image src={cover} alt={alt} fill className="object-cover" sizes="112px" />
        ) : (
          <span className="grid h-full place-items-center text-micro text-[var(--ds-text-muted)]">—</span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <Link
          prefetch={false}
          href={`/shop/${product.slug}`}
          className="text-h3 text-[var(--ds-text)] hover:underline"
          onClick={() => trackProductLinkClick(product.slug)}
        >
          {product.name}
        </Link>
        {product.description ? (
          <p className="line-clamp-2 text-small text-[var(--ds-text-muted)]">{product.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-[var(--ds-text)]">{priceFmt(product.priceCents)}</p>
          <div className="min-w-[10.5rem] shrink-0">
            <ProductInlineCartQty
              productId={product.id}
              slug={product.slug}
              title={product.name}
              priceCents={product.priceCents}
              imageUrl={cover}
            />
          </div>
        </div>
      </div>
    </li>
  );
});
