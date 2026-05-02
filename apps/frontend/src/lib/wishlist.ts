"use client";

import { useWishlistStore, type WishItem } from "@/stores/wishlist-store";

export type { WishItem } from "@/stores/wishlist-store";
export { WISHLIST_KEY } from "@/stores/wishlist-store";

export function getWishlist(): WishItem[] {
  return useWishlistStore.getState().items;
}

export function isInWishlist(productId: string): boolean {
  return useWishlistStore.getState().items.some((i) => i.productId === productId);
}

export function toggleWishlist(item: WishItem): boolean {
  return useWishlistStore.getState().toggle(item);
}

export function removeFromWishlist(productId: string) {
  useWishlistStore.getState().remove(productId);
}

export function clearWishlist() {
  useWishlistStore.getState().clear();
}
