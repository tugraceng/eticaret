"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WISHLIST_UPDATE_EVENT } from "@/lib/platform-storage-events";
import { WISHLIST_KEY, useWishlistStore } from "@/stores/wishlist-store";

function WishlistStorageBridge() {
  useEffect(() => {
    const sync = () => useWishlistStore.getState().syncFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === WISHLIST_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(WISHLIST_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WISHLIST_UPDATE_EVENT, sync);
    };
  }, []);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <WishlistStorageBridge />
      {children}
    </QueryClientProvider>
  );
}
