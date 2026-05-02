"use client";

import { StockMovementsPanel } from "../StockMovementsPanel";

export function StockPanel({ token }: { token: string }) {
  return <StockMovementsPanel token={token} />;
}
