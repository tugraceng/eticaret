"use client";

import { useEffect } from "react";
import { MiniCartDrawer } from "@/components/store/MiniCartDrawer";
import { CART_STORAGE_KEY, syncCartFromStorage } from "@/lib/cart-sync";
import { CART_UPDATE_EVENT } from "@/lib/platform-storage-events";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";
import { useCartStore } from "@/stores/cart-store";
import { BackToTop } from "./BackToTop";
import { CartAbandonToast } from "./CartAbandonToast";
import { EmailCapturePopup } from "./EmailCapturePopup";
import { SiteToaster } from "./SiteToaster";

export function SiteUiChrome() {
  useEffect(() => {
    useCartStore.getState().hydrate();
    const syncFromStorage = () => {
      useCartStore.getState().hydrate();
    };
    window.addEventListener(CART_UPDATE_EVENT, syncFromStorage);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === CART_STORAGE_KEY) syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, syncFromStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const run = () => {
      try {
        if (sessionStorage.getItem(CUSTOMER_TOKEN_KEY)) {
          void syncCartFromStorage().then((merged) => {
            if (merged?.length) useCartStore.getState().replaceLines(merged);
            else useCartStore.getState().hydrate();
          });
        }
      } catch {
        /* ignore */
      }
    };
    run();
    const id = window.setInterval(run, 8000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <SiteToaster />
      <EmailCapturePopup />
      <CartAbandonToast />
      <BackToTop />
      <MiniCartDrawer />
    </>
  );
}
