"use client";

import { useEffect, useState } from "react";
import type { HeroImagePosition } from "@/components/home/homeHeroImage";

/** Admin hero konumu — mobil / masaüstü (matchMedia). */
export function useHeroObjectPosition(
  desktop: HeroImagePosition,
  mobile: HeroImagePosition | null,
): HeroImagePosition {
  const mobilePos = mobile ?? desktop;
  const [position, setPosition] = useState<HeroImagePosition>(mobilePos);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setPosition(mq.matches ? desktop : mobilePos);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [desktop, mobilePos]);

  return position;
}
