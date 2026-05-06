"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (last.current === pathname) return;
    last.current = pathname;
    void fetch(apiUrl("/analytics/events"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
