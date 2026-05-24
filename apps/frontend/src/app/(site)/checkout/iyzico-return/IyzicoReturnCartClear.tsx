"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { clearCartCompletely } from "@/lib/cart-sync";
import { useCartStore } from "@/stores/cart-store";

/** Başarılı iyzico dönüşünde yerel + sunucu sepetini boşaltır. */
export function IyzicoReturnCartClear() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("status") !== "success") return;
    void clearCartCompletely().then(() => {
      useCartStore.getState().replaceLines([]);
    });
  }, [searchParams]);

  return null;
}
