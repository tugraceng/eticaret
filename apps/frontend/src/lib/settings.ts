import { cache } from "react";
import { apiJsonSafe } from "@/lib/api";

export type SiteSettings = {
  id: string;
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  fontFamily: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
  defaultMetaTitle: string | null;
  defaultMetaDesc: string | null;
  ogImageUrl: string | null;
  homeMetaTitle?: string | null;
  homeMetaDesc?: string | null;
  homeSeoKeywords?: string | null;
  homeCanonicalUrl?: string | null;
  homeOgImageUrl?: string | null;
  homeNoIndex?: boolean;
  shopMetaTitle?: string | null;
  shopMetaDesc?: string | null;
  shopSeoKeywords?: string | null;
  shopCanonicalUrl?: string | null;
  shopOgImageUrl?: string | null;
  shopNoIndex?: boolean;
  contactMetaTitle?: string | null;
  contactMetaDesc?: string | null;
  contactSeoKeywords?: string | null;
  contactCanonicalUrl?: string | null;
  contactOgImageUrl?: string | null;
  contactNoIndex?: boolean;
  whatsappEnabled?: boolean;
  whatsappNumber?: string | null;
  whatsappGreeting?: string | null;
  popupEnabled?: boolean;
  popupTitle?: string | null;
  popupBody?: string | null;
  popupCtaLabel?: string | null;
  popupCtaHref?: string | null;
  popupImageUrl?: string | null;
  popupSize?: string | null;
  popupDismissBackdrop?: boolean;
  popupSessionOnly?: boolean;
  popupStorageKey?: string | null;
  topPromoLine1?: string;
  topPromoLine2?: string;
  topPromoLine3?: string;
  topPromoBgColor?: string;
  topPromoTextColor?: string;
  /** Kayan metin: bir turun süresi (sn). Daha büyük = daha yavaş. */
  topPromoMarqueeDurationSec?: number;
  authPanelTitle?: string;
  authPanelSubtitle?: string;
  authPanelImageUrl?: string | null;
  authPanelGradientFrom?: string;
  authPanelGradientTo?: string;
  authPanelTextColor?: string;
  /** xl+ mağaza / ürün: sol sütun kampanya */
  shopRailLeftEnabled?: boolean;
  shopRailLeftTitle?: string;
  shopRailLeftBody?: string;
  shopRailLeftCode?: string;
  shopRailLeftCtaLabel?: string;
  shopRailLeftCtaHref?: string;
  /** xl+ sağ sütun */
  shopRailRightEnabled?: boolean;
  shopRailRightTitle?: string;
  shopRailRightBody?: string;
  shopRailRightCode?: string;
  shopRailRightCtaLabel?: string;
  shopRailRightCtaHref?: string;
  /** Üst menü ve footer’daki “Bize ulaşın” metni ve adresi (boşsa varsayılan) */
  contactNavLabel?: string | null;
  contactNavHref?: string | null;
  /** Üst menü: kategorilerden önce / sonra ek bağlantılar (parseHeaderNav ile okunur) */
  headerNav?: unknown;
};

export type HomeSectionKind =
  | "HERO"
  | "TRUST_STRIP"
  | "CATEGORY_ICONS"
  | "RAIL_BESTSELLERS"
  | "RAIL_POPULAR"
  | "RAIL_NEWEST"
  | "STORY_STRIP"
  | "PROMO_BANNER"
  | "PRODUCT_CATALOG"
  | "BANNERS"
  | "FEATURED_PRODUCTS"
  | "FEATURED_CATEGORIES"
  | "RICH_TEXT"
  | "BLOG_TEASER"
  | "TESTIMONIALS"
  | "CTA";

export type HomeSection = {
  id: string;
  kind: HomeSectionKind;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  mediaUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  config: Record<string, unknown> | null;
  isVisible: boolean;
  sortOrder: number;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  siteName: "3D Baskı Atölyesi",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0f172a",
  secondaryColor: "#3b82f6",
  accentColor: null,
  fontFamily: null,
  contactEmail: null,
  contactPhone: null,
  address: null,
  socialLinks: null,
  defaultMetaTitle: null,
  defaultMetaDesc: null,
  ogImageUrl: null,
  whatsappEnabled: false,
  whatsappNumber: null,
  whatsappGreeting: null,
  popupEnabled: false,
  popupTitle: null,
  popupBody: null,
  popupCtaLabel: null,
  popupCtaHref: null,
  popupImageUrl: null,
  popupSize: "md",
  popupDismissBackdrop: true,
  popupSessionOnly: false,
  popupStorageKey: "1",
  topPromoLine1: "Atölyemizde bastığımız 3D ürünler — anahtarlık, figür, hediyelik",
  topPromoLine2: "2.500 TL üzeri standart kargo ücretsiz",
  topPromoLine3: "Kırılmaya karşı özenli paketleme",
  topPromoBgColor: "#0f172a",
  topPromoTextColor: "#f8fafc",
  topPromoMarqueeDurationSec: 50,
  authPanelTitle: "Siparişleriniz tek hesapta",
  authPanelSubtitle:
    "Bastığımız ürünleri güvenle sipariş edin; kargo ve geçmiş alışverişinizi buradan takip edin.",
  authPanelImageUrl: null,
  authPanelGradientFrom: "#0f172a",
  authPanelGradientTo: "#0369a1",
  authPanelTextColor: "#ffffff",
  shopRailLeftEnabled: true,
  shopRailLeftTitle: "İlk siparişe özel",
  shopRailLeftBody:
    "Sepetinizi tamamladığınızda geçerli %10 indirim kodu. Tek kullanımlık; stoklu ürünlerde geçerlidir.",
  shopRailLeftCode: "ILK3D10",
  shopRailLeftCtaLabel: "Ürünlere git",
  shopRailLeftCtaHref: "/shop",
  shopRailRightEnabled: true,
  shopRailRightTitle: "Kargo bilgisi",
  shopRailRightBody:
    "2.500 TL ve üzeri siparişlerde standart kargo ücretsiz. Teslimat süreleri bölgeye göre değişir.",
  shopRailRightCode: "",
  shopRailRightCtaLabel: "Detaylar",
  shopRailRightCtaHref: "/teslimat-iade",
  contactNavLabel: null,
  contactNavHref: null,
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const data = await apiJsonSafe<SiteSettings>("/settings");
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...data };
});

export const getHomeSections = cache(async (opts?: { all?: boolean }): Promise<HomeSection[]> => {
  const path = opts?.all ? "/home-sections?all=1" : "/home-sections";
  const data = await apiJsonSafe<HomeSection[]>(path);
  if (!Array.isArray(data)) return [];
  return data.map((s) => ({
    ...s,
    config: s.config && typeof s.config === "object" ? s.config : {},
  }));
});
