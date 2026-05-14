"use client";

import { memo } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/atoms";

type Props = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
};

export const ProductCardAddToCart = memo(function ProductCardAddToCart({
  productId,
  slug,
  title,
  priceCents,
  imageUrl,
}: Props) {
  const addLine = useCartStore((s) => s.addLine);
  const openMini = useCartStore((s) => s.openMiniCart);

  return (
    <Button
      type="button"
      size="md"
      variant="secondary"
      className="min-h-10 w-full px-4 text-micro uppercase sm:w-auto"
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
        openMini();
      }}
    >
      Sepete ekle
    </Button>
  );
});
