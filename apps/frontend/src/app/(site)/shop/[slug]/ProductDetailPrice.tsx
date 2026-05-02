"use client";

import { useMemo } from "react";
import { useProductVariantsOptional } from "./ProductVariantContext";

function discountPct(price: number, compare: number) {
  if (compare <= price) return 0;
  return Math.round((1 - price / compare) * 100);
}

function priceFmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export function ProductDetailPrice({
  basePriceCents,
  compareAtCents,
}: {
  basePriceCents: number;
  compareAtCents: number | null | undefined;
}) {
  const { effectivePriceCents, variants } = useProductVariantsOptional();
  const price = useMemo(
    () => (variants.length > 0 ? effectivePriceCents(basePriceCents) : basePriceCents),
    [variants.length, effectivePriceCents, basePriceCents],
  );
  const onSale = typeof compareAtCents === "number" && compareAtCents > price;
  const pct = onSale ? discountPct(price, compareAtCents) : 0;

  return (
    <div className="mt-5 flex flex-wrap items-baseline gap-3">
      <p className="text-3xl font-semibold text-slate-900">{priceFmt(price)}</p>
      {onSale && (
        <>
          <p className="text-lg text-slate-400 line-through">{priceFmt(compareAtCents!)}</p>
          {pct > 0 && (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
              %{pct} indirim
            </span>
          )}
        </>
      )}
    </div>
  );
}
