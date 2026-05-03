/** Ortak admin paneli tipleri — AdminApp ve paneller arasında paylaşılır. */

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  priceCents: number;
  compareAtCents?: number | null;
  sku?: string | null;
  trackStock?: boolean;
  stock: number;
  isPublished: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<{ id: string; url: string; alt?: string | null; sortOrder: number }>;
  variants?: Array<{
    id: string;
    label: string;
    sku: string | null;
    priceCents: number | null;
    stock: number;
    trackStock: boolean;
    sortOrder: number;
    isActive: boolean;
  }>;
};

export type OrderItemRow = {
  quantity: number;
  titleSnapshot: string;
  unitPriceCents: number;
  variantLabelSnapshot?: string | null;
};

export type OrderRow = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  guestEmail?: string | null;
  items?: OrderItemRow[];
};

export type AnalyticsRow = { event: string; _count: { _all: number } };

export type SalesInsights = {
  days: number;
  daily: Array<{ date: string; revenueCents: number; orders: number }>;
  bestsellers: Array<{ productId: string; quantitySold: number; name: string; slug: string }>;
  crm: Array<{
    orderId: string;
    at: string;
    status: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    totalCents: number;
    currency: string;
  }>;
};

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  _count?: { products: number };
};

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  type: string;
  createdAt: string;
};

export type AdminProductVariant = {
  id: string;
  label: string;
  sku: string | null;
  priceCents: number | null;
  stock: number;
  trackStock: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type AdminCounters = {
  pendingReviews: number;
  pendingReturns: number;
  lowStock: number;
  pendingOrders: number;
  marketingOptInCount: number;
  abandonedCartCount: number;
  todayRevenueCents: number;
  lastCampaign: {
    title: string;
    successCount: number;
    failCount: number;
    recipientCount: number;
    sentAt: string | null;
  } | null;
};
