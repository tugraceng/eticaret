import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { buildPageMetadata, seoExcerpt } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName;
  const title = settings.shopMetaTitle?.trim() || `Mağaza · ${siteName}`;
  const description = seoExcerpt(
    settings.shopMetaDesc?.trim() ||
      settings.defaultMetaDesc?.trim() ||
      `${siteName} ürün kataloğu — kategori, fiyat ve stok filtreleriyle alışveriş.`,
  );
  return buildPageMetadata({
    title,
    description,
    path: "/shop",
    siteOgImage: settings.shopOgImageUrl ?? settings.ogImageUrl,
    fields: {
      metaTitle: settings.shopMetaTitle,
      metaDescription: settings.shopMetaDesc,
      seoKeywords: settings.shopSeoKeywords,
      seoCanonicalUrl: settings.shopCanonicalUrl,
      seoOgImageUrl: settings.shopOgImageUrl,
      seoNoIndex: settings.shopNoIndex,
    },
  });
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
