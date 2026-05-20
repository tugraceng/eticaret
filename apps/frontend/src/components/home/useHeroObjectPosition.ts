"use client";

import { useSyncExternalStore } from "react";
import type { HeroImagePosition } from "@/components/home/homeHeroImage";

const DESKTOP_MQ = "(min-width: 768px)";

function readIsDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(DESKTOP_MQ).matches;
}

function subscribePosition(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Admin hero konumu — mobil / masaüstü; ilk client paint doğru breakpoint ile. */
export function useHeroObjectPosition(
  desktop: HeroImagePosition,
  mobile: HeroImagePosition | null,
): HeroImagePosition {
  const mobilePos = mobile ?? desktop;
  return useSyncExternalStore(
    subscribePosition,
    () => (readIsDesktop() ? desktop : mobilePos),
    () => mobilePos,
  );
}
