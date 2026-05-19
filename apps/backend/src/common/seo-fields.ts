/** Ortak SEO alanları — ürün, kategori, CMS sayfa DTO'larında tekrar kullanılır. */
export type SeoPatch = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgImageUrl?: string | null;
  seoNoIndex?: boolean;
};

export function normalizeSeoPatch(data: SeoPatch): SeoPatch {
  const out: SeoPatch = {};
  if (data.metaTitle !== undefined) {
    out.metaTitle = data.metaTitle?.trim() ? data.metaTitle.trim() : null;
  }
  if (data.metaDescription !== undefined) {
    out.metaDescription = data.metaDescription?.trim() ? data.metaDescription.trim() : null;
  }
  if (data.seoKeywords !== undefined) {
    out.seoKeywords = data.seoKeywords?.trim() ? data.seoKeywords.trim() : null;
  }
  if (data.seoCanonicalUrl !== undefined) {
    out.seoCanonicalUrl = data.seoCanonicalUrl?.trim() ? data.seoCanonicalUrl.trim() : null;
  }
  if (data.seoOgImageUrl !== undefined) {
    out.seoOgImageUrl = data.seoOgImageUrl?.trim() ? data.seoOgImageUrl.trim() : null;
  }
  if (data.seoNoIndex !== undefined) {
    out.seoNoIndex = Boolean(data.seoNoIndex);
  }
  return out;
}
