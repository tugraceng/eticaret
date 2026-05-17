"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { commerceAddToCart } from "@/lib/commerce-analytics";
import { showSiteToast } from "@/lib/site-toast";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/stores/cart-store";
import { useProductVariantsOptional } from "./ProductVariantContext";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

export function ProductStickyAtcBar({
  productId,
  name,
  basePriceCents,
  slug,
  imageUrl,
}: {
  productId: string;
  name: string;
  basePriceCents: number;
  slug?: string;
  imageUrl?: string;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const { variants, selected, allVariantsSoldOut, effectivePriceCents, resolvedPrimaryImageUrl } =
    useProductVariantsOptional();
  const addLine = useCartStore((s) => s.addLine);
  const openMiniCart = useCartStore((s) => s.openMiniCart);

  const unitPrice = useMemo(
    () => (variants.length > 0 ? effectivePriceCents() : basePriceCents),
    [variants.length, effectivePriceCents, basePriceCents],
  );

  const thumbUrl = resolvedPrimaryImageUrl || imageUrl;

  const priceLabel = fmt(unitPrice);

  useEffect(() => {
    const el = document.getElementById("product-purchase");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(!(e?.isIntersecting ?? true));
      },
      { threshold: 0.12, rootMargin: "-72px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addOne = useCallback(
    (goCheckout: boolean) => {
      if (variants.length > 0) {
        if (!selected || allVariantsSoldOut || (selected.trackStock && selected.stock < 1)) {
          showSiteToast({ message: "Lütfen stokta olan bir seçenek seçin.", kind: "info" });
          return;
        }
      }
      const title = selected ? `${name} — ${selected.label}` : name;
      addLine({
        productId,
        productVariantId: selected?.id,
        quantity: 1,
        title,
        priceCents: unitPrice,
        slug,
        imageUrl: thumbUrl,
      });
      commerceAddToCart({
        item_id: productId,
        item_name: title,
        price: unitPrice / 100,
        currency: "TRY",
        quantity: 1,
      });
      if (goCheckout) {
        showSiteToast({ message: "Sepet güncellendi, ödeme adımına yönlendiriliyorsunuz.", kind: "info" });
        router.push("/checkout");
      } else {
        showSiteToast({ message: "Sepete 1 adet eklendi.", kind: "success" });
        openMiniCart();
      }
    },
    [
      productId,
      name,
      unitPrice,
      slug,
      thumbUrl,
      router,
      variants.length,
      selected,
      allVariantsSoldOut,
      addLine,
      openMiniCart,
    ],
  );

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.2)] backdrop-blur-md transition-[transform,opacity] duration-300 md:bottom-auto md:top-20 md:border-b md:border-t-0 md:shadow-md",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 md:-translate-y-full",
      )}
      role="region"
      aria-label="Hızlı satın alma"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 lg:max-w-7xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900">{name}</p>
          <p className="text-sm font-bold text-slate-800">{priceLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => addOne(false)}
            className="rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Sepete ekle
          </button>
          <button
            type="button"
            onClick={() => addOne(true)}
            className="hidden rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
          >
            Hemen al
          </button>
        </div>
      </div>
    </div>
  );
}
