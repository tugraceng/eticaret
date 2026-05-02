import type { HomeSectionKind } from "@/lib/settings";

/**
 * Ürün vitrini satırı (PRODUCT_CATALOG) listede yoksa, vitrin bu içerik türlerinden
 * hemen önce eklenir — eski şablonda grid’in öne çıkan/CMS bloklarından önce gelmesi gibi.
 */
export const IMPLICIT_RETAIL_BEFORE_KINDS = new Set<HomeSectionKind>([
  "BLOG_TEASER",
  "BANNERS",
  "TESTIMONIALS",
  "RICH_TEXT",
  "CTA",
]);
