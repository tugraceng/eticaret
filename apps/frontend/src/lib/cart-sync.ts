import { apiUrl } from "@/lib/api";
import { notifyCartUpdated } from "@/lib/platform-storage-events";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";

export const CART_STORAGE_KEY = "platform_cart";

export type LocalCartLine = {
  lineKey: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  title: string;
  priceCents?: number;
  slug?: string;
  imageUrl?: string;
};

export function lineKeyFor(productId: string, productVariantId?: string | null) {
  return productVariantId ? `v:${productVariantId}` : `p:${productId}`;
}

type CartPayloadLine = {
  productId: string;
  productVariantId?: string;
  lineKey?: string;
  quantity: number;
  title?: string;
  priceCents?: number;
  slug?: string;
  imageUrl?: string;
};

function normalizeStoredLine(x: Record<string, unknown>): LocalCartLine | null {
  const productId = typeof x.productId === "string" ? x.productId : "";
  if (!productId) return null;
  const productVariantId =
    typeof x.productVariantId === "string" ? x.productVariantId : undefined;
  const lineKey =
    typeof x.lineKey === "string" && x.lineKey
      ? x.lineKey
      : lineKeyFor(productId, productVariantId);
  return {
    lineKey,
    productId,
    productVariantId,
    quantity: Math.max(1, Number(x.quantity) || 1),
    title: typeof x.title === "string" ? x.title : "Ürün",
    priceCents: typeof x.priceCents === "number" ? x.priceCents : undefined,
    slug: typeof x.slug === "string" ? x.slug : undefined,
    imageUrl: typeof x.imageUrl === "string" ? x.imageUrl : undefined,
  };
}

export async function mergeLocalCartToServer(lines: CartPayloadLine[]): Promise<LocalCartLine[] | null> {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (!token) return null;
  try {
    const res = await fetch(apiUrl("/customers/me/cart/merge"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          productVariantId: l.productVariantId,
          lineKey: l.lineKey ?? lineKeyFor(l.productId, l.productVariantId),
          title: l.title,
          priceCents: l.priceCents,
          slug: l.slug,
          imageUrl: l.imageUrl,
        })),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lines?: LocalCartLine[] };
    return Array.isArray(data.lines) ? data.lines : null;
  } catch {
    return null;
  }
}

export function readLocalCartFromStorage(): LocalCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
      .map(normalizeStoredLine)
      .filter((x): x is LocalCartLine => x !== null);
  } catch {
    return [];
  }
}

export function writeLocalCartToStorage(lines: LocalCartLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new StorageEvent("storage", { key: CART_STORAGE_KEY }));
  notifyCartUpdated();
}

/** Sepete satır ekle veya aynı satırda (ürün + seçenek) adet artır */
export function mergeLineIntoLocalCart(line: {
  productId: string;
  productVariantId?: string;
  quantity: number;
  title: string;
  priceCents?: number;
  slug?: string;
  imageUrl?: string;
}) {
  const cart = readLocalCartFromStorage();
  const q = Math.max(1, Math.floor(Number(line.quantity) || 1));
  const lk = lineKeyFor(line.productId, line.productVariantId);
  const existing = cart.find((l) => l.lineKey === lk);
  if (existing) {
    existing.quantity += q;
    if (typeof line.priceCents === "number") existing.priceCents = line.priceCents;
    if (line.slug) existing.slug = line.slug;
    if (line.imageUrl) existing.imageUrl = line.imageUrl;
    existing.title = line.title;
  } else {
    cart.push({
      lineKey: lk,
      productId: line.productId,
      productVariantId: line.productVariantId,
      quantity: q,
      title: line.title,
      priceCents: line.priceCents,
      slug: line.slug,
      imageUrl: line.imageUrl,
    });
  }
  writeLocalCartToStorage(cart);
}

export async function syncCartFromStorage(): Promise<LocalCartLine[] | null> {
  const local = readLocalCartFromStorage();
  const merged = await mergeLocalCartToServer(local);
  if (merged) writeLocalCartToStorage(merged);
  return merged;
}
