"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readLocalCartFromStorage } from "@/lib/cart-sync";
import { showSiteToast } from "@/lib/site-toast";

const HINT = "platform_cart_abandon_hint";

export function CartAbandonToast() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/checkout")) {
      sessionStorage.removeItem(HINT);
      return;
    }
    if (pathname.startsWith("/cart")) return;
    if (sessionStorage.getItem(HINT) !== "1") return;

    const lines = readLocalCartFromStorage();
    sessionStorage.removeItem(HINT);
    if (lines.length === 0) return;

    showSiteToast({
      message: "Sepetinizde ürün kaldı — ödemeyi tamamlamak için sepet veya ödeme adımına dönebilirsiniz.",
      kind: "info",
    });
  }, [pathname]);

  return null;
}
