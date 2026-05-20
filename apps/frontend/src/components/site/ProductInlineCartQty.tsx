"use client";

import { memo, useEffect, useMemo } from "react";
import { lineKeyFor } from "@/lib/cart-sync";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/atoms";
import { cn } from "@/lib/cn";

type Props = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
  /** Sepete ekle satırı — kart altında tam genişlik */
  className?: string;
  /** Mobil mockup: kare cyan sepet ikonu */
  variant?: "default" | "icon";
};

export const ProductInlineCartQty = memo(function ProductInlineCartQty({
  productId,
  slug,
  title,
  priceCents,
  imageUrl,
  className,
  variant = "default",
}: Props) {
  const lineKey = useMemo(() => lineKeyFor(productId), [productId]);
  const qty = useCartStore((s) => s.lines.find((l) => l.lineKey === lineKey)?.quantity ?? 0);
  const addLine = useCartStore((s) => s.addLine);
  const setLineQuantity = useCartStore((s) => s.setLineQuantity);

  useEffect(() => {
    useCartStore.getState().hydrate();
  }, []);

  const btnBase =
    "flex h-10 w-10 shrink-0 items-center justify-center text-lg font-medium leading-none text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:pointer-events-none disabled:opacity-40";

  if (qty <= 0) {
    if (variant === "icon") {
      return (
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#5a9cb8] text-white shadow-sm transition hover:bg-[#7eb8d4]",
            className,
          )}
          aria-label="Sepete ekle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addLine({ productId, quantity: 1, title, priceCents, slug, imageUrl });
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" />
            <circle cx="10" cy="20" r="1.5" />
            <circle cx="17" cy="20" r="1.5" />
          </svg>
        </button>
      );
    }
    return (
      <Button
        type="button"
        size="md"
        variant="secondary"
        className={cn("min-h-10 w-full px-4 text-micro uppercase", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addLine({
            productId,
            quantity: 1,
            title,
            priceCents,
            slug,
            imageUrl,
          });
        }}
      >
        Sepete ekle
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-full max-w-full items-stretch overflow-hidden rounded-xl border border-slate-200 bg-slate-50/90 shadow-sm",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={btnBase}
        aria-label="Sepetten bir azalt"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLineQuantity(lineKey, qty - 1);
        }}
      >
        −
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center border-x border-slate-200 bg-white px-1 text-sm font-semibold tabular-nums text-slate-900">
        {qty}
      </span>
      <button
        type="button"
        className={btnBase}
        aria-label="Sepete bir ekle"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLineQuantity(lineKey, qty + 1);
        }}
      >
        +
      </button>
    </div>
  );
});

ProductInlineCartQty.displayName = "ProductInlineCartQty";
