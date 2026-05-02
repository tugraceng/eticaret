export type SiteToastKind = "success" | "error" | "info";

export const SITE_TOAST_EVENT = "platform:site-toast";

export type SiteToastDetail = {
  message: string;
  kind?: SiteToastKind;
};

export function showSiteToast(detail: SiteToastDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SITE_TOAST_EVENT, { detail }));
}
