"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { useCartStore } from "@/stores/cart-store";
import type { ProductCardData } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/atoms";
import { apiAssetUrl } from "@/lib/api";

type Props = { product: ProductCardData };

function priceFmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export const ProductListRow = memo(function ProductListRow({ product }: Props) {
  const addLine = useCartStore((s) => s.addLine);
  const openMini = useCartStore((s) => s.openMiniCart);
  const cover = apiAssetUrl(product.images?.[0]?.url) ?? undefined;
  const alt = product.images?.[0]?.alt ?? product.name;

  return (
    <li className="flex gap-4 rounded-ds-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4 shadow-card">
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-ds-lg bg-[var(--ds-surface-muted)] sm:h-28 sm:w-28"
      >
        {cover ? (
          <Image src={cover} alt={alt} fill className="object-cover" sizes="112px" />
        ) : (
          <span className="grid h-full place-items-center text-micro text-[var(--ds-text-muted)]">—</span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <Link prefetch={false} href={`/shop/${product.slug}`} className="text-h3 text-[var(--ds-text)] hover:underline">
          {product.name}
        </Link>
        {product.description ? (
          <p className="line-clamp-2 text-small text-[var(--ds-text-muted)]">{product.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-[var(--ds-text)]">{priceFmt(product.priceCents)}</p>
          <Button
            type="button"
            size="md"
            variant="secondary"
            className="min-h-10 px-4 text-micro uppercase"
            onClick={() => {
              addLine({
                productId: product.id,
                quantity: 1,
                title: product.name,
                priceCents: product.priceCents,
                slug: product.slug,
                imageUrl: cover,
              });
              openMini();
            }}
          >
            Sepete ekle
          </Button>
        </div>
      </div>
    </li>
  );
});
