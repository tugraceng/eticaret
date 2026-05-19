"use client";

import Link from "next/link";
import { shopCategoryHref, type HeaderNavCategory } from "@/lib/category-nav";
import { cn } from "@/lib/cn";

type Props = {
  categories: HeaderNavCategory[];
  activeCategory: HeaderNavCategory;
  activeCategoryId: string;
  onHoverCategory: (id: string) => void;
  onMouseEnterPanel: () => void;
  onMouseLeavePanel: () => void;
};

/** Masaüstü kategori mega menü — sol ana kategori şeridi, sağ alt kategoriler. */
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
      className="absolute inset-x-0 top-full z-[80] border-t border-slate-100 bg-white shadow-[0_28px_56px_-24px_rgba(15,23,42,0.22)]"
      onMouseEnter={onMouseEnterPanel}
      onMouseLeave={onMouseLeavePanel}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[11rem] gap-0 md:gap-2">
          <ul className="hidden w-52 shrink-0 flex-col border-r border-slate-100 pr-4 md:flex">
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
                      "block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                      selected
                        ? "bg-sky-50 text-sky-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="min-w-0 flex-1 md:pl-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Kategori
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  {activeCategory.name}
                </p>
              </div>
              <Link
                href={shopCategoryHref(activeCategory.id)}
                className="shrink-0 text-xs font-semibold uppercase tracking-wider text-sky-700 transition-colors hover:text-sky-900"
              >
                Tümünü gör →
              </Link>
            </div>
            <ul
              className={cn(
                "mt-5 grid gap-2",
                activeCategory.children.length > 8
                  ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {activeCategory.children.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={shopCategoryHref(sub.id)}
                    className="flex min-h-[2.75rem] items-center rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:border-sky-200 hover:bg-white hover:shadow-sm"
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
