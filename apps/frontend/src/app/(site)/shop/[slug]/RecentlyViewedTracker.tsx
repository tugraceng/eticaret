"use client";

import { useEffect } from "react";
import { notifyRecentProductsUpdated, RECENT_PRODUCTS_STORAGE_KEY } from "@/lib/recent-products";

const MAX = 20;

function pushRecent(productId: string) {
  try {
    const raw = localStorage.getItem(RECENT_PRODUCTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX);
    localStorage.setItem(RECENT_PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    notifyRecentProductsUpdated();
  } catch {
    /* ignore */
  }
}

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return;
    pushRecent(productId);
  }, [productId]);
  return null;
}

