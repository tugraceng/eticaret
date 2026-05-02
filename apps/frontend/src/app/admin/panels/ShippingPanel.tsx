"use client";

import { ShippingRatesEditor } from "../ShippingRatesEditor";

export function ShippingPanel({ token }: { token: string }) {
  return <ShippingRatesEditor token={token} />;
}
