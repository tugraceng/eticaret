import type { Metadata } from "next";
import { absoluteFromSite, getMetadataBase } from "@/lib/site-url";

export type SeoFields = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgImageUrl?: string | null;
  seoNoIndex?: boolean | null;
};

export type BuildMetadataOptions = {
  /** Sayfa başlığı fallback */
  title: string;
  /** Meta açıklama fallback */
  description: string;
  /** Varsayılan canonical yolu (ör. `/about`) */
  path: string;
  /** Site geneli OG görseli */
  siteOgImage?: string | null;
  fields?: SeoFields | null;
  /** openGraph type */
  ogType?: "website" | "article";
};

/** Düz metni meta açıklama uzunluğuna kısaltır. */
export function seoExcerpt(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const last = cut.lastIndexOf(" ");
  return `${(last > 40 ? cut.slice(0, last) : cut).trim()}…`;
}

function parseKeywords(raw?: string | null): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
  return list.length ? list : undefined;
}

/** Admin SEO alanları + fallback ile Next.js Metadata üretir. */
export function buildPageMetadata(opts: BuildMetadataOptions): Metadata {
  const f = opts.fields;
  const title = (f?.metaTitle?.trim() || opts.title).slice(0, 200);
  const description = seoExcerpt(f?.metaDescription?.trim() || opts.description, 200);
  const base = getMetadataBase().toString().replace(/\/$/, "");
  const canonicalPath = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const canonical = f?.seoCanonicalUrl?.trim()
    ? absoluteFromSite(f.seoCanonicalUrl.trim()) ?? `${base}${canonicalPath}`
    : `${base}${canonicalPath}`;
  const ogImage =
    absoluteFromSite(f?.seoOgImageUrl?.trim() || undefined) ??
    absoluteFromSite(opts.siteOgImage ?? undefined);
  const keywords = parseKeywords(f?.seoKeywords);
  const noIndex = Boolean(f?.seoNoIndex);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: opts.ogType ?? "website",
      locale: "tr_TR",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function organizationJsonLd(settings: {
  siteName: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  socialLinks?: Record<string, string> | null;
}) {
  const base = getMetadataBase().toString().replace(/\/$/, "");
  const sameAs = Object.values(settings.socialLinks ?? {}).filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0,
  );
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: base,
    ...(settings.logoUrl ? { logo: absoluteFromSite(settings.logoUrl) } : {}),
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function localBusinessJsonLd(settings: {
  siteName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}) {
  const base = getMetadataBase().toString().replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.siteName,
    url: `${base}/contact`,
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; item?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      ...(entry.item ? { item: entry.item } : {}),
    })),
  };
}
