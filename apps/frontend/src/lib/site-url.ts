const FALLBACK_SITE = "http://localhost:3000";

/** Geçersiz .env değerlerinde tüm sayfaların 500 vermesini önler. */
export function getMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") return u;
    } catch {
      /* ignore */
    }
  }
  return new URL(FALLBACK_SITE);
}

/** Open Graph vb. için mutlak URL (göreli yollar metadataBase ile birleştirilir). */
export function absoluteFromSite(href: string | null | undefined): string | undefined {
  const h = href?.trim();
  if (!h) return undefined;
  try {
    return new URL(h, getMetadataBase()).toString();
  } catch {
    return undefined;
  }
}
