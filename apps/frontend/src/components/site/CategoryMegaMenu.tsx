"use client";

import Link from "next/link";
import { shopCategoryHref, type HeaderNavCategory } from "@/lib/category-nav";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/design-system";

type Props = {
  categories: HeaderNavCategory[];
  activeCategory: HeaderNavCategory;
  activeCategoryId: string;
  onHoverCategory: (id: string) => void;
  onMouseEnterPanel: () => void;
  onMouseLeavePanel: () => void;
};

/** Masaüstü kategori mega menü — koyu tema */
export function CategoryMegaMenu({
  categories,
  activeCategory,
  activeCategoryId,
  onHoverCategory,
  onMouseEnterPanel,
  onMouseLeavePanel,
}: Props) {
  return (
    <div
      className="si-mega-menu absolute inset-x-0 top-full z-[80] -mt-px border-t border-white/10 bg-[#0c111b] shadow-[0_28px_56px_-20px_rgba(0,0,0,0.65)]"
      onMouseEnter={onMouseEnterPanel}
      onMouseLeave={onMouseLeavePanel}
    >
      <div className={cn(siteContainerClass, "py-6")}>
        <div className="flex min-h-[11rem] gap-0 md:gap-2">
          <ul className="hidden w-52 shrink-0 flex-col border-r border-white/10 pr-4 md:flex">
            {categories.map((cat) => {
              const selected = activeCategoryId === cat.id;
              return (
                <li key={`mega-rail-${cat.id}`}>
                  <Link
                    href={shopCategoryHref(cat.id)}
                    onMouseEnter={() => {
                      if (cat.children.length > 0) onHoverCategory(cat.id);
                    }}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
                      selected
                        ? "bg-sky-500/15 text-sky-300"
                        : "text-slate-300 hover:bg-white/6 hover:text-white",
                    )}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="min-w-0 flex-1 md:pl-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Kategori
                </p>
                <p className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-semibold tracking-tight text-white">
                  {activeCategory.name}
                </p>
              </div>
              <Link
                href={shopCategoryHref(activeCategory.id)}
                className="shrink-0 text-xs font-semibold uppercase tracking-wider text-sky-400 transition-colors hover:text-sky-300"
              >
                Tümünü gör →
              </Link>
            </div>
            <ul
              className={cn(
                "mt-5 grid gap-2.5",
                activeCategory.children.length > 8
                  ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {activeCategory.children.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={shopCategoryHref(sub.id)}
                    className="flex min-h-[2.75rem] items-center rounded-xl border border-white/10 bg-[#121a28] px-4 py-2.5 text-sm font-medium text-slate-200 transition-[border-color,background-color,box-shadow] duration-200 hover:border-sky-500/35 hover:bg-sky-500/10 hover:text-white"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
