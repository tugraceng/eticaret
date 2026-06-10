import { apiUrl } from "@/lib/api";
import type { LocalCartLine } from "@/lib/cart-sync";

export type CartLineStock = {
  lineKey: string;
  trackStock: boolean;
  maxQty: number | null;
  hasVariants: boolean;
  requiresVariant: boolean;
};

export async function fetchCartStockLimits(lines: LocalCartLine[]): Promise<Map<string, CartLineStock>> {
  const map = new Map<string, CartLineStock>();
  if (!lines.length) return map;
  try {
    const res = await fetch(apiUrl("/products/stock-limits"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({
          lineKey: l.lineKey,
          productId: l.productId,
          productVariantId: l.productVariantId,
        })),
      }),
    });
    if (!res.ok) return map;
    const data = (await res.json()) as CartLineStock[];
    if (!Array.isArray(data)) return map;
    for (const row of data) {
      if (row?.lineKey) map.set(row.lineKey, row);
    }
  } catch {
    /* ignore */
  }
  return map;
}

export function capCartQuantity(
  lineKey: string,
  desired: number,
  limits: Map<string, CartLineStock>,
): number {
  const q = Math.max(0, Math.floor(desired));
  if (q === 0) return 0;
  const info = limits.get(lineKey);
  if (!info?.trackStock || info.maxQty == null) return q;
  return Math.min(q, Math.max(0, info.maxQty));
}

export function canIncreaseCartQty(lineKey: string, current: number, limits: Map<string, CartLineStock>): boolean {
  const info = limits.get(lineKey);
  if (!info) return true;
  if (info.requiresVariant) return false;
  if (!info.trackStock || info.maxQty == null) return true;
  return current < info.maxQty;
}
