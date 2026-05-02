"use client";

import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

export type SiteSettingsPayload = {
  shippingFeeCents?: number;
  freeShippingThresholdCents?: number;
};

export function useSiteSettingsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["site", "settings"],
    queryFn: async (): Promise<SiteSettingsPayload> => {
      const res = await fetch(apiUrl("/settings"));
      if (!res.ok) throw new Error("settings");
      return (await res.json()) as SiteSettingsPayload;
    },
    enabled: options?.enabled !== false,
  });
}
