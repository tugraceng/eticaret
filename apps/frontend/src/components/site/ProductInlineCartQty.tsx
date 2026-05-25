"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { lineKeyFor } from "@/lib/cart-sync";
import { showSiteToast } from "@/lib/site-toast";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/atoms";
import { cn } from "@/lib/cn";

const QTY_PEEK_MS = 2800;

type Props = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
  hasVariants?: boolean;
  trackStock?: boolean;
  stock?: number;
  /** Sepete ekle satırı — kart altında tam genişlik */
  className?: string;
  /** @deprecated Yalnızca geri uyumluluk; ızgara için `default` kullanın */
  variant?: "default" | "icon";
};

export const ProductInlineCartQty = memo(function ProductInlineCartQty({
  productId,
  slug,
  title,
  priceCents,
  imageUrl,
  hasVariants = false,
  trackStock = false,
  stock = 0,
  className,
  variant = "default",
}: Props) {
  const router = useRouter();
  const lineKey = useMemo(() => lineKeyFor(productId), [productId]);
  const qty = useCartStore((s) => s.lines.find((l) => l.lineKey === lineKey)?.quantity ?? 0);
  const addLine = useCartStore((s) => s.addLine);
  const setLineQuantity = useCartStore((s) => s.setLineQuantity);
  const [qtyPeek, setQtyPeek] = useState(false);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxQty = useMemo(() => {
    if (hasVariants) return 0;
    if (!trackStock) return Number.POSITIVE_INFINITY;
    return Math.max(0, stock);
  }, [hasVariants, trackStock, stock]);

  const outOfStock = !hasVariants && trackStock && maxQty <= 0;

  useEffect(() => {
    useCartStore.getState().hydrate();
  }, []);

  const clearPeekTimer = useCallback(() => {
    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }
  }, []);

  const schedulePeekEnd = useCallback(() => {
    clearPeekTimer();
    peekTimerRef.current = setTimeout(() => {
      setQtyPeek(false);
      peekTimerRef.current = null;
    }, QTY_PEEK_MS);
  }, [clearPeekTimer]);

  const startQtyPeek = useCallback(() => {
    setQtyPeek(true);
    schedulePeekEnd();
  }, [schedulePeekEnd]);

  useEffect(() => {
    if (qty <= 0) setQtyPeek(false);
    return clearPeekTimer;
  }, [qty, clearPeekTimer]);

  const goSelectVariant = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/shop/${slug}`);
    },
    [router, slug],
  );

  const addOne = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasVariants) {
        goSelectVariant(e);
        return;
      }
      if (outOfStock) {
        showSiteToast({ message: "Bu ürün stokta yok.", kind: "info" });
        return;
      }
      if (trackStock && qty >= maxQty) {
        showSiteToast({ message: "Stokta daha fazla ürün yok.", kind: "info" });
        return;
      }
      addLine({ productId, quantity: 1, title, priceCents, slug, imageUrl });
      startQtyPeek();
    },
    [
      addLine,
      goSelectVariant,
      hasVariants,
      maxQty,
      outOfStock,
      productId,
      qty,
      title,
      priceCents,
      slug,
      imageUrl,
      startQtyPeek,
      trackStock,
    ],
  );

  const showStepper = qty > 0 && qtyPeek && !hasVariants;

  const btnBase =
    "flex h-10 w-10 shrink-0 items-center justify-center text-lg font-medium leading-none transition-colors hover:bg-white/10 active:bg-white/15 disabled:pointer-events-none disabled:opacity-40";

  if (hasVariants) {
    return (
      <Button
        type="button"
        size="md"
        variant="secondary"
        className={cn("si-product-atc-btn min-h-10 w-full px-4 text-micro font-semibold uppercase", className)}
        onClick={goSelectVariant}
      >
        Seçenek seç
      </Button>
    );
  }

  if (outOfStock) {
    return (
      <Button
        type="button"
        size="md"
        variant="secondary"
        disabled
        className={cn("si-product-atc-btn min-h-10 w-full px-4 text-micro font-semibold uppercase opacity-50", className)}
      >
        Stokta yok
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        size="md"
        variant="secondary"
        className={cn("si-product-atc-btn min-h-10 w-full px-3 text-micro font-semibold uppercase", className)}
        onClick={addOne}
      >
        Sepete ekle
      </Button>
    );
  }

  if (!showStepper) {
    return (
      <Button
        type="button"
        size="md"
        variant="secondary"
        className={cn("si-product-atc-btn min-h-10 w-full px-4 text-micro font-semibold uppercase", className)}
        onClick={addOne}
      >
        Sepete ekle
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "si-product-qty-stepper flex h-10 w-full max-w-full items-stretch overflow-hidden rounded-xl border border-white/12 bg-[#0a0f18] shadow-sm",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={cn(btnBase, "text-slate-200")}
        aria-label="Sepetten bir azalt"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLineQuantity(lineKey, qty - 1);
          schedulePeekEnd();
        }}
      >
        −
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center border-x border-white/10 bg-[#121a28] px-1 text-sm font-semibold tabular-nums text-white">
        {qty}
      </span>
      <button
        type="button"
        className={cn(btnBase, "text-slate-200")}
        aria-label="Sepete bir ekle"
        disabled={trackStock && qty >= maxQty}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (trackStock && qty >= maxQty) {
            showSiteToast({ message: "Stokta daha fazla ürün yok.", kind: "info" });
            return;
          }
          setLineQuantity(lineKey, qty + 1);
          schedulePeekEnd();
        }}
      >
        +
      </button>
    </div>
  );
});

ProductInlineCartQty.displayName = "ProductInlineCartQty";
