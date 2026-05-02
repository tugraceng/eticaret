"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import { useProductVariants } from "./ProductVariantContext";

/** Sunucudan gelen variant listesi — chips. */
export const ProductVariantSelector = memo(function ProductVariantSelector() {
  const { variants, selectedId, setSelectedId, allVariantsSoldOut } = useProductVariants();

  if (variants.length === 0) return null;

  return (
    <div className="mt-6 space-y-3 border-t border-slate-200/90 pt-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Seçenek</p>
      {allVariantsSoldOut ? (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          Tüm seçenekler şu an stokta değil.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Ürün seçeneği">
        {variants.map((v) => {
          const active = selectedId === v.id;
          const soldOut = v.trackStock && v.stock <= 0;
          return (
            <button
              key={v.id}
              type="button"
              disabled={soldOut}
              onClick={() => setSelectedId(v.id)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-xs font-semibold transition-colors",
                soldOut && "cursor-not-allowed opacity-45",
                active && !soldOut
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
              )}
              aria-pressed={active}
            >
              {v.label}
              {v.trackStock && v.stock > 0 && v.stock <= 5 ? (
                <span className="ml-1.5 text-[10px] font-normal opacity-90">({v.stock})</span>
              ) : null}
              {soldOut ? <span className="ml-1 text-[10px] font-medium">· Tükendi</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
});
