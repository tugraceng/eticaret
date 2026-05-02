/** Aynı sekmede localStorage yazıldığında `storage` tetiklenmez; sayaçlar için custom event. */

export const WISHLIST_UPDATE_EVENT = "platform_wishlist_updated";
export const CART_UPDATE_EVENT = "platform_cart_updated";

export function notifyWishlistUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WISHLIST_UPDATE_EVENT));
}

export function notifyCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATE_EVENT));
}
