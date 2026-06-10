"use client";

import { useEffect, useMemo, useState } from "react";
import type { LocalCartLine } from "@/lib/cart-sync";
import { fetchCartStockLimits, type CartLineStock } from "@/lib/cart-stock";

export function useCartStockLimits(lines: LocalCartLine[], enabled = true) {
  const [limits, setLimits] = useState<Map<string, CartLineStock>>(new Map());
  const signature = useMemo(
    () =>
      lines
        .map((l) => `${l.lineKey}:${l.productId}:${l.productVariantId ?? ""}:${l.quantity}`)
        .join("|"),
    [lines],
  );

  useEffect(() => {
    if (!enabled || !lines.length) {
      setLimits(new Map());
      return;
    }
    let cancelled = false;
    void fetchCartStockLimits(lines).then((m) => {
      if (!cancelled) setLimits(m);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, signature, lines]);

  return limits;
}
