"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { notifyWishlistUpdated } from "@/lib/platform-storage-events";

export const WISHLIST_KEY = "platform_wishlist";

export type WishItem = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
};

type WishlistState = {
  items: WishItem[];
  hydrated: boolean;
  hydrate: () => void;
  syncFromStorage: () => void;
  toggle: (item: WishItem) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
};

function readRaw(): WishItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as WishItem[];
    if (parsed && typeof parsed === "object" && parsed !== null && "state" in parsed) {
      const st = (parsed as { state?: { items?: unknown } }).state;
      if (st?.items && Array.isArray(st.items)) return st.items as WishItem[];
    }
    return [];
  } catch {
    return [];
  }
}

function writeRaw(items: WishItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new StorageEvent("storage", { key: WISHLIST_KEY }));
  notifyWishlistUpdated();
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    set({ items: readRaw(), hydrated: true });
  },

  syncFromStorage: () => {
    set({ items: readRaw() });
  },

  toggle: (item) => {
    if (!get().hydrated) get().hydrate();
    const items = get().items;
    const idx = items.findIndex((i) => i.productId === item.productId);
    let added: boolean;
    let next: WishItem[];
    if (idx >= 0) {
      next = items.filter((_, i) => i !== idx);
      added = false;
    } else {
      next = [...items, item];
      added = true;
    }
    writeRaw(next);
    set({ items: next });
    return added;
  },

  remove: (productId) => {
    if (!get().hydrated) get().hydrate();
    const next = get().items.filter((i) => i.productId !== productId);
    writeRaw(next);
    set({ items: next });
  },

  clear: () => {
    writeRaw([]);
    set({ items: [], hydrated: true });
  },
}));

export function selectWishlistCount(state: Pick<WishlistState, "items">) {
  return state.items.length;
}

export function useWishlistHydrated() {
  const hydrated = useWishlistStore((s) => s.hydrated);
  useEffect(() => {
    useWishlistStore.getState().hydrate();
  }, []);
  return hydrated;
}
