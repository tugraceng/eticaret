import { useCartStore } from "@/stores/cart-store";

/** Tüm site chrome bileşenleri bu olayı dinleyerek modal/backdrop kapatır. */
export const SITE_OVERLAY_RESET_EVENT = "platform:site-overlay-reset";

/** Sayfa değişiminde / bfcache sonrası: sepet, scroll kilidi ve takılı backdrop temizliği. */
export function resetSiteOverlaysOnNavigation() {
  if (typeof document === "undefined") return;
  useCartStore.getState().closeMiniCart();
  document.body.style.overflow = "";
  document.documentElement.style.removeProperty("overflow");
  window.dispatchEvent(new Event(SITE_OVERLAY_RESET_EVENT));
}
