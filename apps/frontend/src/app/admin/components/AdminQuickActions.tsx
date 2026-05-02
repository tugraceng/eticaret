"use client";

import Link from "next/link";
import { Icon } from "../ui";

type Props = {
  onGoProducts: () => void;
  onGoCategories: () => void;
  onGoOrders: () => void;
};

export function AdminQuickActions({ onGoProducts, onGoCategories, onGoOrders }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm sm:gap-2.5 sm:px-4">
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:inline">
        Hızlı işlem
      </span>
      <button
        type="button"
        onClick={onGoProducts}
        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 transition hover:bg-sky-100"
      >
        <Icon.Plus className="h-3.5 w-3.5" />
        Yeni ürün
      </button>
      <button
        type="button"
        onClick={onGoCategories}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
      >
        <Icon.Folder className="h-3.5 w-3.5" />
        Yeni kategori
      </button>
      <button
        type="button"
        onClick={onGoOrders}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
      >
        <Icon.Bag className="h-3.5 w-3.5" />
        Siparişler
      </button>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
      >
        <span aria-hidden>↗</span>
        Siteye dön
      </Link>
    </div>
  );
}
