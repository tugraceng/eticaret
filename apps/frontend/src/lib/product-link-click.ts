import { apiUrl } from "@/lib/api";

/** Mağaza / vitrin ürün linki tıklamasını kaydeder (fire-and-forget). */
export function trackProductLinkClick(slug: string) {
  if (!slug?.trim() || typeof window === "undefined") return;
  const url = apiUrl(`/products/${encodeURIComponent(slug.trim())}/track-click`);
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(url, new Blob([], { type: "application/json" }));
    } else {
      void fetch(url, { method: "POST", keepalive: true });
    }
  } catch {
    /* sessiz */
  }
}
