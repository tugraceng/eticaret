import { create } from "zustand";
import {
  readLocalCartFromStorage,
  writeLocalCartToStorage,
  type LocalCartLine,
  mergeLineIntoLocalCart,
  CART_STORAGE_KEY,
} from "@/lib/cart-sync";

type CartState = {
  lines: LocalCartLine[];
  miniCartOpen: boolean;
  hydrated: boolean;
  hydrate: () => void;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  toggleMiniCart: () => void;
  /** Sepet satırlarını değiştir ve depoya yaz */
  replaceLines: (lines: LocalCartLine[]) => void;
  addLine: (line: {
    productId: string;
    productVariantId?: string;
    quantity: number;
    title: string;
    priceCents?: number;
    slug?: string;
    imageUrl?: string;
  }) => void;
  setLineQuantity: (lineKey: string, quantity: number) => void;
  removeLine: (lineKey: string) => void;
  clearCart: () => void;
};

function totalQty(lines: LocalCartLine[]) {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

function subtotalCents(lines: LocalCartLine[]) {
  return lines.reduce((s, l) => s + (l.priceCents ?? 0) * l.quantity, 0);
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  miniCartOpen: false,
  hydrated: false,

  hydrate: () => {
    const lines = readLocalCartFromStorage();
    set({ lines, hydrated: true });
  },

  openMiniCart: () => set({ miniCartOpen: true }),
  closeMiniCart: () => set({ miniCartOpen: false }),
  toggleMiniCart: () => set((s) => ({ miniCartOpen: !s.miniCartOpen })),

  replaceLines: (lines) => {
    writeLocalCartToStorage(lines);
    set({ lines });
  },

  addLine: (line) => {
    mergeLineIntoLocalCart(line);
    set({ lines: readLocalCartFromStorage() });
  },

  setLineQuantity: (lineKey, quantity) => {
    const q = Math.max(0, Math.floor(quantity));
    const next = get()
      .lines.map((l) => (l.lineKey === lineKey ? { ...l, quantity: q } : l))
      .filter((l) => l.quantity > 0);
    writeLocalCartToStorage(next);
    set({ lines: next });
  },

  removeLine: (lineKey) => {
    const next = get().lines.filter((l) => l.lineKey !== lineKey);
    writeLocalCartToStorage(next);
    set({ lines: next });
  },

  clearCart: () => {
    writeLocalCartToStorage([]);
    set({ lines: [] });
  },
}));

export function selectCartTotalQty(state: CartState) {
  return totalQty(state.lines);
}

export function selectCartSubtotalCents(state: CartState) {
  return subtotalCents(state.lines);
}

export { CART_STORAGE_KEY };
