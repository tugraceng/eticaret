import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiAssetUrl, apiJson } from "@/lib/api";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { absoluteFromSite } from "@/lib/site-url";
import { buildPageMetadata, seoExcerpt } from "@/lib/seo";
import { AddToCart } from "./ui";
import { Reviews } from "./Reviews";
import { RecentlyViewedTracker } from "./RecentlyViewedTracker";
import { ProductDetailPrice } from "./ProductDetailPrice";
import { ProductGallery } from "./ProductGallery";
import { ProductStickyAtcBar } from "./ProductStickyAtcBar";
import { ProductVariantProvider, type ProductVariantDto } from "./ProductVariantContext";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ProductViewTracker } from "./ProductViewTracker";
import { ProductTrustStrip } from "./ProductTrustStrip";
import { ProductDetailTabs } from "./ProductDetailTabs";

type ProductImage = { id?: string; url: string; alt: string | null };
type ProductVariantApi = {
  id: string;
  label: string;
  stock: number;
  trackStock: boolean;
  priceCents: number | null;
  productImageId?: string | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgImageUrl?: string | null;
  seoNoIndex?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  /** Mağazada stok adedi / düşük stok uyarısı gösterilsin mi */
  showPublicStockCount?: boolean;
  priceCents: number;
  compareAtCents?: number | null;
  stock?: number;
  images?: ProductImage[];
  category?: { id: string; name: string; slug: string } | null;
  variants?: ProductVariantApi[];
};

async function getProductBySlug(slug: string): Promise<Product> {
  return apiJson<Product>(`/products/${slug}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    const heroImage = product.images?.[0]?.url ?? null;
    return buildPageMetadata({
      title: product.name,
      description: seoExcerpt(
        product.metaDescription?.trim() ||
          product.description?.trim() ||
          `${product.name} ürününü inceleyin ve güvenle sipariş verin.`,
      ),
      path: `/shop/${product.slug}`,
      fields: {
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        seoKeywords: product.seoKeywords,
        seoCanonicalUrl: product.seoCanonicalUrl,
        seoOgImageUrl: product.seoOgImageUrl || heroImage,
        seoNoIndex: product.seoNoIndex,
      },
    });
  } catch {
    return {
      title: "Ürün",
      description: "Ürün detayı",
    };
  }
}

function productJsonLd(product: Product, pageUrl: string, imageUrl?: string | null) {
  const desc =
    product.metaDescription?.trim() || product.description?.trim() || `${product.name} — ürün detayı`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: desc,
    image: imageUrl ? [imageUrl] : undefined,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "TRY",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        typeof product.stock === "number" && product.stock <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: Product | null = null;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }
  const gallery = (product.images ?? [])
    .map((img, i) => ({
      id: img.id?.trim() || `img-${i}`,
      url: apiAssetUrl(img.url) ?? "",
      alt: img.alt ?? null,
    }))
    .filter((img) => img.url.length > 0);
  const onSale =
    typeof product.compareAtCents === "number" && product.compareAtCents! > product.priceCents;

  let related: ProductCardData[] = [];
  try {
    related = await apiJson<ProductCardData[]>(`/products/${slug}/related`);
  } catch {
    related = [];
  }

  const categoryHref = product.category
    ? `/shop?categoryId=${encodeURIComponent(product.category.id)}`
    : "/shop";

  const crumbs = [
    { href: "/shop", label: "Mağaza" },
    ...(product.category
      ? [{ href: categoryHref, label: product.category.name }]
      : []),
  ];

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const productCanonical = `${siteUrl}/shop/${product.slug}`;
  const heroImage = gallery[0]?.url;
  const jsonLd = productJsonLd(product, productCanonical, absoluteFromSite(heroImage));
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mağaza", item: `${siteUrl}/shop` },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${siteUrl}/shop?categoryId=${encodeURIComponent(product.category.id)}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 3 : 2,
        name: product.name,
        item: productCanonical,
      },
    ],
  };

  const variantDtos: ProductVariantDto[] = (product.variants ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    stock: v.stock,
    trackStock: v.trackStock,
    priceCents: v.priceCents,
    productImageId: v.productImageId ?? null,
  }));

  const productGalleryRefs = gallery.map(({ id, url }) => ({ id, url }));
  const showStockCount = product.showPublicStockCount !== false;
  const hasVariantOptions = variantDtos.length > 0;

  return (
    <ProductVariantProvider
      variants={variantDtos}
      basePriceCents={product.priceCents}
      productGallery={productGalleryRefs}
      showPublicStockCount={showStockCount}
    >
      <div className="bg-slate-50/80">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProductViewTracker productId={product.id} name={product.name} priceCents={product.priceCents} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <RecentlyViewedTracker productId={product.id} />

        <nav
          className="mb-6 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
          aria-label="Sayfa hiyerarşisi"
        >
          {crumbs.map((c, i) => (
            <span key={c.href} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300" aria-hidden>/</span>}
              <Link href={c.href} className="hover:text-slate-800">
                {c.label}
              </Link>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-300" aria-hidden>
              /
            </span>
            <span className="line-clamp-1 max-w-[12rem] text-slate-700 sm:max-w-none">{product.name}</span>
          </span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
          <ProductGallery productName={product.name} images={gallery} onSale={onSale} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {product.name}
              </h1>
              {product.isFeatured ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Öne çıkan
                </span>
              ) : null}
              {product.isNew ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  Yeni
                </span>
              ) : null}
            </div>

            <ProductDetailPrice
              basePriceCents={product.priceCents}
              compareAtCents={product.compareAtCents}
            />

            {showStockCount &&
              !hasVariantOptions &&
              typeof product.stock === "number" &&
              product.stock > 0 &&
              product.stock <= 5 && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                Son {product.stock} ürün — tükenmeden tamamlayın.
              </p>
            )}

            {!hasVariantOptions && typeof product.stock === "number" && (
              <p
                className={`mt-2 inline-flex items-center gap-2 text-xs font-semibold ${
                  product.stock > 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    product.stock > 0 ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {product.stock > 0
                  ? showStockCount
                    ? `Stokta (${product.stock})`
                    : "Stokta"
                  : "Stokta yok"}
              </p>
            )}

            <ProductTrustStrip />

            <ProductVariantSelector />

            <AddToCart
              productId={product.id}
              name={product.name}
              basePriceCents={product.priceCents}
              slug={product.slug}
              imageUrl={heroImage}
            />
          </div>
        </div>

        <ProductDetailTabs description={product.description} />

        <Reviews slug={product.slug} kicker="Müşteriler" heading="Deneyimler" />

        {related.length > 0 && (
          <section className="mt-8 border-t border-slate-200/90 pt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Tamamlayın</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Beraber iyi gidenler
                </h2>
              </div>
              {product.category && (
                <Link
                  href={categoryHref}
                  className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 sm:inline-flex"
                >
                  Koleksiyonu gör
                </Link>
              )}
            </div>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {related.slice(0, 8).map((p, i) => (
                <li key={p.id} className="fade-up flex h-full min-h-0" style={{ animationDelay: `${i * 40}ms` }}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <ProductStickyAtcBar
        productId={product.id}
        name={product.name}
        basePriceCents={product.priceCents}
        slug={product.slug}
        imageUrl={heroImage}
      />
      </div>
    </ProductVariantProvider>
  );
}
