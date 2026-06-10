"use client";

import { useEffect, useState } from "react";
import { canIncreaseCartQty, capCartQuantity, type CartLineStock } from "@/lib/cart-stock";

type Props = {
  lineKey: string;
  quantity: number;
  limits: Map<string, CartLineStock>;
  onChange: (lineKey: string, qty: number) => void;
  size?: "sm" | "md";
};

export function CartLineQuantity({ lineKey, quantity, limits, onChange, size = "md" }: Props) {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = () => {
    const parsed = Number.parseInt(draft.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(quantity));
      return;
    }
    const capped = capCartQuantity(lineKey, parsed, limits);
    onChange(lineKey, capped);
    setDraft(String(capped));
  };

  const btn =
    size === "sm" ?
      "grid h-9 w-9 place-items-center text-[var(--ds-text)] hover:bg-[var(--ds-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
    : "grid h-10 w-10 place-items-center rounded-full text-lg text-slate-700 transition hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40";

  const inputClass =
    size === "sm" ?
      "w-10 min-w-0 border-0 bg-transparent text-center text-small font-semibold tabular-nums text-[var(--ds-text)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    : "w-10 min-w-0 border-0 bg-transparent text-center text-sm font-bold tabular-nums text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  const wrap =
    size === "sm" ?
      "inline-flex items-center rounded-full border border-[var(--ds-border)]"
    : "inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 p-0.5 shadow-inner";

  return (
    <div className={wrap}>
      <button type="button" className={btn} aria-label="Adet azalt" onClick={() => onChange(lineKey, quantity - 1)}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        aria-label="Adet"
        className={inputClass}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
      <button
        type="button"
        className={btn}
        aria-label="Adet artır"
        disabled={!canIncreaseCartQty(lineKey, quantity, limits)}
        onClick={() => onChange(lineKey, capCartQuantity(lineKey, quantity + 1, limits))}
      >
        +
      </button>
    </div>
  );
}
