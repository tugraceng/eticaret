"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/components/site/ProductCard";

export function HomeStoryStrip({
  products,
  kicker = "Keşfet",
  heading = "Vitrinden ürünler",
  subheading = "Kaydırarak ürünleri inceleyin; ayrıntı için görsele dokunun.",
}: {
  products: ProductCardData[];
  kicker?: string | null;
  heading?: string | null;
  subheading?: string | null;
}) {
  const picks = products.filter((p) => p.images?.[0]?.url).slice(0, 12);
  if (picks.length < 3) return null;

  return (
    <section className="si-section-alt border-y border-white/[0.06] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          {kicker ? <p className="si-kicker">{kicker}</p> : null}
          {heading ? <h2 className="si-heading mt-1 text-xl sm:text-2xl">{heading}</h2> : null}
          {subheading ? <p className="si-body mt-1">{subheading}</p> : null}
        </div>
        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {picks.map((p) => {
            const src = p.images![0]!.url;
            const alt = p.images![0]?.alt ?? p.name;
            return (
              <li
                key={p.id}
                className="relative w-[118px] shrink-0 snap-center sm:w-[132px]"
              >
                <Link
                  prefetch={false}
                  href={`/shop/${p.slug}`}
                  className="group flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/25 focus-visible:ring-offset-2"
                >
                  <div className="relative h-[152px] w-[118px] overflow-hidden rounded-2xl border border-white/10 bg-[#1a222e] shadow-lg transition duration-300 group-hover:scale-[1.03] group-hover:border-sky-500/30 sm:h-[168px] sm:w-[132px]">
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      className="object-cover"
                      sizes="132px"
                    />
                  </div>
                  <span className="line-clamp-2 max-w-[7.5rem] text-center text-[11px] font-medium leading-tight text-slate-300 group-hover:text-white">
                    {p.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
