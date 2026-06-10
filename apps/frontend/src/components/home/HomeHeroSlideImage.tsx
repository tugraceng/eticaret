"use client";

import Image from "next/image";
import { apiAssetUrl } from "@/lib/api";

export function HomeHeroSlideImage({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const resolved = apiAssetUrl(src) ?? src;
  if (!resolved) return null;

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      sizes="(max-width: 1024px) 100vw, 50vw"
      quality={priority ? 82 : 72}
      className={`object-cover object-center ${className}`}
    />
  );
}
