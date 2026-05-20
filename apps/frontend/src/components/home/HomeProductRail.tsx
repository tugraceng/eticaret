"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

type Props = {
  title: string;
  href: string;
  products: ProductCardData[];
  subtitle?: string | null;
};

export function HomeProductRail({ title, href, products, subtitle }: Props) {
  const railRef = useRef<HTMLUListElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 16 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="si-heading">{title}</h3>
          {subtitle ? <p className="si-body mt-2 max-w-xl">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/12 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Önceki ürünler"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/12 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Sonraki ürünler"
          >
            <span aria-hidden>→</span>
          </button>
          <Link
            href={href}
            className="ml-1 hidden text-xs font-semibold uppercase tracking-wider text-sky-400/90 hover:text-sky-300 sm:inline"
          >
            Tümünü gör →
          </Link>
        </div>
      </div>

      <ul
        ref={railRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
      >
        {products.map((p) => (
          <li
            key={p.id}
            className="flex w-[min(72vw,220px)] shrink-0 snap-start sm:w-[200px] md:w-[220px] lg:w-[240px]"
          >
            <div className="flex h-full min-h-[22rem] w-full sm:min-h-[24rem]">
              <ProductCard product={p} />
            </div>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-sky-400/90 hover:text-sky-300 sm:hidden"
      >
        Tümünü gör →
      </Link>
    </div>
  );
}
