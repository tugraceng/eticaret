"use client";

import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/app/(site)/shop/[slug]/ui";
import type { ProductCardData } from "@/components/site/ProductCard";
import { apiAssetUrl } from "@/lib/api";

function priceFmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

type Props = {
  products: ProductCardData[];
  /** İlk kartta “Yeni” rozeti */
  markFirstAsNew?: boolean;
};

/** 4 sütunlu minimal ürün ızgarası — kalp + fiyat, düz köşeli kartlar. */
export function HomeEditorialProductGrid({ products, markFirstAsNew = true }: Props) {
  const list = products.slice(0, 8);
  if (list.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
      {list.map((p, idx) => {
        const coverRaw = p.images?.[0]?.url;
        const secondRaw = p.images?.[1]?.url;
        const cover = apiAssetUrl(coverRaw) ?? undefined;
        const second = apiAssetUrl(secondRaw) ?? undefined;
        const alt = p.images?.[0]?.alt ?? p.name;
        const alt2 = p.images?.[1]?.alt ?? alt;
        const onSale =
          typeof p.compareAtCents === "number" && p.compareAtCents > p.priceCents;
        return (
          <li key={p.id} className="group relative">
            <Link
              prefetch={false}
              href={`/shop/${p.slug}`}
              className="absolute inset-0 z-[1] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              aria-label={`${p.name} — ürüne git`}
            />
            <div className="pointer-events-none relative z-[2]">
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                {markFirstAsNew && idx === 0 ? (
                  <span className="absolute bottom-3 left-3 z-10 bg-[#2563eb] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Yeni
                  </span>
                ) : null}
                <div className="pointer-events-auto absolute right-2 top-2 z-[3]">
                  <WishlistButton
                    productId={p.id}
                    slug={p.slug}
                    title={p.name}
                    priceCents={p.priceCents}
                    imageUrl={cover}
                    size="sm"
                  />
                </div>
                {second ? (
                  <div className="absolute inset-0 z-[1]" role="img" aria-hidden>
                    <Image
                      src={second}
                      alt={alt2}
                      fill
                      className="object-cover opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:opacity-100"
                      sizes="(max-width: 768px) 50vw, 25vw"
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
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">Görsel yok</div>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-medium text-neutral-900">{p.name}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {onSale ? (
                  <>
                    <span className="text-sm font-semibold tabular-nums text-[#2563eb]">
                      {priceFmt(p.priceCents)}
                    </span>
                    <span className="text-xs tabular-nums text-neutral-400 line-through">
                      {priceFmt(p.compareAtCents!)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-semibold tabular-nums text-neutral-900">
                    {priceFmt(p.priceCents)}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
