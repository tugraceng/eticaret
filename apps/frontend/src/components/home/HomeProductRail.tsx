"use client";

import Link from "next/link";
import { useRef } from "react";
import { WishlistButton } from "@/app/(site)/shop/[slug]/ui";
import type { ProductCardData } from "@/components/site/ProductCard";

type Props = {
  title: string;
  href: string;
  products: ProductCardData[];
};

export function HomeProductRail({ title, href, products }: Props) {
  const railRef = useRef<HTMLUListElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 480, behavior: "smooth" });
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="grid h-7 w-7 place-items-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Sola kaydır"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="grid h-7 w-7 place-items-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Sağa kaydır"
          >
            →
          </button>
          <Link href={href} className="ml-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
            Tümünü gör →
          </Link>
        </div>
      </div>

      <ul
        ref={railRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        {products.map((p) => {
          const cover = p.images?.[0]?.url;
          const onSale =
            typeof p.compareAtCents === "number" && p.compareAtCents > p.priceCents;
          const discountPct = onSale
            ? Math.round(((p.compareAtCents! - p.priceCents) / p.compareAtCents!) * 100)
            : 0;
          return (
            <li key={p.id} className="relative w-[160px] shrink-0 snap-start rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
              <Link
                prefetch={false}
                href={`/shop/${p.slug}`}
                className="absolute inset-0 z-[1] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/25 focus-visible:ring-offset-2"
                aria-label={`${p.name} — ürüne git`}
              />
              <div className="pointer-events-none relative z-[2]">
                <div className="relative aspect-square rounded-lg bg-slate-100">
                  {onSale ? (
                    <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
                      <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        %{discountPct}
                      </span>
                    </div>
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
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.images?.[0]?.alt ?? p.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-700">{p.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {(p.priceCents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
