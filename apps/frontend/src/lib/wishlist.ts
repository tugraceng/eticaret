"use client";

import { notifyWishlistUpdated } from "@/lib/platform-storage-events";

export const WISHLIST_KEY = "platform_wishlist";

export type WishItem = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
};

function readRaw(): WishItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WishItem[]) : [];
  } catch {
    return [];
  }
}

function writeRaw(items: WishItem[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new StorageEvent("storage", { key: WISHLIST_KEY }));
  notifyWishlistUpdated();
}

export function getWishlist(): WishItem[] {
  return readRaw();
}

export function isInWishlist(productId: string): boolean {
  return readRaw().some((i) => i.productId === productId);
}

export function toggleWishlist(item: WishItem): boolean {
  const items = readRaw();
  const idx = items.findIndex((i) => i.productId === item.productId);
  if (idx >= 0) {
    items.splice(idx, 1);
    writeRaw(items);
    return false;
  }
  items.push(item);
  writeRaw(items);
  return true;
}

export function removeFromWishlist(productId: string) {
  const items = readRaw().filter((i) => i.productId !== productId);
  writeRaw(items);
}

export function clearWishlist() {
  writeRaw([]);
}
