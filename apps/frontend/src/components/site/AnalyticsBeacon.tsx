"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (last.current === pathname) return;
    last.current = pathname;
    void fetch(`${API}/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
