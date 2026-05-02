"use client";

import { useEffect, useState } from "react";
import { Field } from "../ui";
import type { AdminProductVariant } from "../types";

export function ProductVariantRow({
  basePriceCents,
  variant,
  busy,
  priceFmt,
  onUpdate,
  onDelete,
}: {
  basePriceCents: number;
  variant: AdminProductVariant;
  busy: boolean;
  priceFmt: (cents: number, currency?: string) => string;
  onUpdate: (
    variantId: string,
    body: {
      label: string;
      sku: string | null;
      priceCents: number | null;
      stock: number;
      trackStock: boolean;
      isActive: boolean;
    },
  ) => Promise<void>;
  onDelete: (variantId: string, label: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(variant.label);
  const [sku, setSku] = useState(variant.sku ?? "");
  const [priceTry, setPriceTry] = useState(
    variant.priceCents != null ? (variant.priceCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [stock, setStock] = useState(String(variant.stock));
  const [trackStock, setTrackStock] = useState(variant.trackStock);
  const [isActive, setIsActive] = useState(variant.isActive);

  useEffect(() => {
    setLabel(variant.label);
    setSku(variant.sku ?? "");
    setPriceTry(
      variant.priceCents != null ? (variant.priceCents / 100).toFixed(2).replace(".", ",") : "",
    );
    setStock(String(variant.stock));
    setTrackStock(variant.trackStock);
    setIsActive(variant.isActive);
  }, [variant]);

  const save = async () => {
    let priceCents: number | null;
    const pt = priceTry.trim();
    if (pt === "") priceCents = null;
    else {
      const c = Math.round(parseFloat(pt.replace(",", ".")) * 100);
      if (!Number.isFinite(c) || c < 0) return;
      priceCents = c;
    }
    await onUpdate(variant.id, {
      label: label.trim(),
      sku: sku.trim() || null,
      priceCents,
      stock: parseInt(stock, 10) || 0,
      trackStock,
      isActive,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Etiket">
          <input className="input-soft text-xs" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="SKU">
          <input className="input-soft text-xs" value={sku} onChange={(e) => setSku(e.target.value)} />
        </Field>
        <Field label={`Fiyat (boş = ${priceFmt(basePriceCents)})`}>
          <input
            className="input-soft text-xs"
            placeholder="varsayılan"
            value={priceTry}
            onChange={(e) => setPriceTry(e.target.value)}
          />
        </Field>
        <Field label="Stok">
          <input className="input-soft text-xs" value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
        <label className="mt-6 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={trackStock}
            onChange={(e) => setTrackStock(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Stok takip
        </label>
        <label className="mt-6 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Aktif
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !label.trim()}
          onClick={() => void save()}
          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Kaydet
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete(variant.id, variant.label)}
          className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
        >
          Sil
        </button>
      </div>
    </div>
  );
}
