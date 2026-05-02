export const RECENT_PRODUCTS_STORAGE_KEY = "platform_recent_products";
export const RECENT_PRODUCTS_UPDATE_EVENT = "platform_recent_products_updated";

export function notifyRecentProductsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RECENT_PRODUCTS_UPDATE_EVENT));
}
