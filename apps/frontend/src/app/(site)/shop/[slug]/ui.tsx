"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { commerceAddToCart } from "@/lib/commerce-analytics";
import { toggleWishlist } from "@/lib/wishlist";
import { showSiteToast } from "@/lib/site-toast";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/cn";
import { useProductVariantsOptional } from "./ProductVariantContext";

export function AddToCart({
  productId,
  name,
  basePriceCents,
  slug,
  imageUrl,
}: {
  productId: string;
  name: string;
  basePriceCents?: number;
  slug?: string;
  imageUrl?: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { variants, selected, allVariantsSoldOut, effectivePriceCents } = useProductVariantsOptional();
  const addLine = useCartStore((s) => s.addLine);
  const openMiniCart = useCartStore((s) => s.openMiniCart);

  const unitPrice =
    typeof basePriceCents === "number"
      ? variants.length > 0
        ? effectivePriceCents()
        : basePriceCents
      : undefined;

  const inc = () => setQty((q) => q + 1);
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const add = useCallback(
    (goCheckout: boolean) => {
      if (variants.length > 0) {
        if (!selected || allVariantsSoldOut) {
          showSiteToast({ message: "Lütfen stokta olan bir seçenek seçin.", kind: "info" });
          return;
        }
        if (selected.trackStock && selected.stock < qty) {
          showSiteToast({ message: "Bu seçenek için yeterli stok yok.", kind: "info" });
          return;
        }
      }
      const title = selected ? `${name} — ${selected.label}` : name;
      addLine({
        productId,
        productVariantId: selected?.id,
        quantity: qty,
        title,
        priceCents: unitPrice,
        slug,
        imageUrl,
      });
      commerceAddToCart({
        item_id: productId,
        item_name: title,
        price: typeof unitPrice === "number" ? unitPrice / 100 : undefined,
        currency: "TRY",
        quantity: qty,
      });
      if (goCheckout) {
        showSiteToast({ message: "Sepet güncellendi, ödeme adımına yönlendiriliyorsunuz.", kind: "info" });
        router.push("/checkout");
      } else {
        showSiteToast({ message: "Ürün sepete eklendi.", kind: "success" });
        openMiniCart();
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }
    },
    [
      productId,
      name,
      qty,
      unitPrice,
      slug,
      imageUrl,
      router,
      variants.length,
      selected,
      allVariantsSoldOut,
      addLine,
      openMiniCart,
    ],
  );

  return (
    <div id="product-purchase" className="mt-8 scroll-mt-28 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={dec}
            className="grid h-11 w-11 place-items-center rounded-l-full text-slate-700 hover:bg-slate-50"
            aria-label="Azalt"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-14 border-x border-slate-200 bg-transparent py-2 text-center text-sm outline-none"
            aria-label="Adet"
          />
          <button
            type="button"
            onClick={inc}
            className="grid h-11 w-11 place-items-center rounded-r-full text-slate-700 hover:bg-slate-50"
            aria-label="Arttır"
          >
            +
          </button>
        </div>
        <WishlistButton
          productId={productId}
          slug={slug ?? ""}
          title={name}
          priceCents={variants.length > 0 ? effectivePriceCents() : basePriceCents ?? 0}
          imageUrl={imageUrl}
        />
      </div>
      <div className="flex max-w-md flex-col gap-3">
        <button type="button" onClick={() => add(false)} className="store-cta-primary">
          Sepete ekle
        </button>
        <button type="button" onClick={() => add(true)} className="store-cta-secondary">
          Hemen al
        </button>
      </div>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-opacity duration-300",
          added ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-live="polite"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sepete eklendi
      </div>
    </div>
  );
}

export function WishlistButton({
  productId,
  slug,
  title,
  priceCents,
  imageUrl,
  size = "md",
}: {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
  size?: "sm" | "md";
}) {
  const active = useWishlistStore((s) => s.items.some((i) => i.productId === productId));

  return (
    <button
      type="button"
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggleWishlist({ productId, slug, title, priceCents, imageUrl });
        showSiteToast({
          message: now ? "Favorilere eklendi." : "Favorilerden çıkarıldı.",
          kind: "success",
        });
      }}
      className={cn(
        "grid place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-rose-500",
        size === "sm" ? "h-9 w-9" : "h-11 w-11",
        active && "text-rose-500",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={size === "sm" ? "h-4 w-4" : "h-5 w-5"}
        aria-hidden
      >
        <path d="M20.8 5.4a5.5 5.5 0 0 0-7.8 0L12 6.4l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  );
}
