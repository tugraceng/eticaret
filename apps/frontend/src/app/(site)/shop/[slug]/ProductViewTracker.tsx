"use client";

import { useEffect, useRef } from "react";
import { commerceViewItem } from "@/lib/commerce-analytics";

export function ProductViewTracker({
  productId,
  name,
  priceCents,
}: {
  productId: string;
  name: string;
  priceCents: number;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    commerceViewItem({
      item_id: productId,
      item_name: name,
      price: priceCents / 100,
      currency: "TRY",
      quantity: 1,
    });
  }, [productId, name, priceCents]);
  return null;
}
