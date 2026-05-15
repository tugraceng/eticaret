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

  return (
    <Button
      type="button"
      size="md"
      variant="secondary"
      className="min-h-10 w-full px-4 text-micro uppercase"
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
});
