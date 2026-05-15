"use client";

import { memo } from "react";
import { ProductInlineCartQty } from "@/components/site/ProductInlineCartQty";

type Props = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
};

export const ProductCardAddToCart = memo(function ProductCardAddToCart(props: Props) {
  return <ProductInlineCartQty {...props} />;
});
ProductCardAddToCart.displayName = "ProductCardAddToCart";
