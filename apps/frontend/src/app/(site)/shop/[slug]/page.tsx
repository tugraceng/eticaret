import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiJson } from "@/lib/api";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { absoluteFromSite } from "@/lib/site-url";
import { AddToCart } from "./ui";
import { Reviews } from "./Reviews";
import { RecentlyViewedTracker } from "./RecentlyViewedTracker";
import { ProductDetailPrice } from "./ProductDetailPrice";
import { ProductGallery } from "./ProductGallery";
import { ProductStickyAtcBar } from "./ProductStickyAtcBar";
import { ProductVariantProvider, type ProductVariantDto } from "./ProductVariantContext";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ProductViewTracker } from "./ProductViewTracker";
import { ProductSocialProof } from "./ProductSocialProof";
import { ProductTrustStrip } from "./ProductTrustStrip";

type ProductImage = { url: string; alt: string | null };
type ProductVariantApi = {
  id: string;
  label: string;
  stock: number;
  trackStock: boolean;
  priceCents: number | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
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
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const canonical = `${siteUrl}/shop/${product.slug}`;
    const title = (product.metaTitle?.trim() || product.name).slice(0, 200);
    const rawDesc =
      product.metaDescription?.trim() ||
      product.description?.trim() ||
      `${product.name} ürününü inceleyin ve güvenle sipariş verin.`;
    const description = rawDesc.slice(0, 200);
    const image = absoluteFromSite(product.images?.[0]?.url);
    const kw = product.seoKeywords
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
    return {
      title,
      description,
      keywords: kw?.length ? kw : undefined,
      alternates: { canonical },
      openGraph: {
        url: canonical,
        title,
        description,
        type: "website",
        ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
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
  const gallery = product.images ?? [];
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
  const jsonLd = productJsonLd(product, productCanonical, absoluteFromSite(product.images?.[0]?.url));
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
  }));

  const hasVariantOptions = variantDtos.length > 0;

  return (
    <ProductVariantProvider variants={variantDtos}>
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-7xl">
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

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)] lg:items-start">
          <ProductGallery productName={product.name} images={gallery} onSale={onSale} />

          <div>
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

            {!hasVariantOptions &&
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
                {product.stock > 0 ? `Stokta (${product.stock})` : "Stokta yok"}
              </p>
            )}

            <ProductSocialProof slug={product.slug} />

            {product.description && (
              <p className="mt-6 text-sm leading-relaxed text-slate-600 [text-wrap:pretty]">
                {product.description}
              </p>
            )}

            <ProductTrustStrip />

            <ProductVariantSelector />

            <AddToCart
              productId={product.id}
              name={product.name}
              basePriceCents={product.priceCents}
              slug={product.slug}
              imageUrl={product.images?.[0]?.url}
            />

            <ul className="mt-8 flex flex-col gap-3 border-t border-slate-200/90 pt-6 text-xs text-slate-600 sm:grid sm:grid-cols-2 sm:gap-x-4">
              <li className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M3 9l9-5 9 5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
                    <path d="M9 11V3M15 11V3" />
                  </svg>
                </span>
                <span>2.000 TL ve üzeri alışverişlerde <strong className="font-semibold text-slate-800">kargo</strong> koşullarımız</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M12 2l1.8 3.2h3.6L16.6 7.8l1.1 3.1L12 8.4 6.3 10.9l1.1-3.1L6.6 5.2h3.6L12 2z" />
                  </svg>
                </span>
                <span>İade ve tüketici haklarınız <strong className="font-semibold text-slate-800">güvence</strong> altındadır</span>
              </li>
            </ul>
          </div>
        </div>

        <section className="mt-20 border-t border-slate-200/90 pt-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Öne çıkan ayrıntılar
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Seçkin malzemeler ve sade tasarım, günlük kullanımda konfor ve güven.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {(
              [
                {
                  t: "Hızlı hazırlık",
                  d: "Siparişiniz 24-48 saat içinde fatura ve paketleme aşamalarına alınır; kargo aşamasında bilgilendirme yapılır.",
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <rect x="1" y="4" width="13" height="9" rx="1" />
                      <path d="M14 7.5h2.5L19 8.5V12H14V7.5z" />
                      <circle cx="6" cy="18" r="2" />
                      <circle cx="17" cy="18" r="2" />
                    </svg>
                  ),
                },
                {
                  t: "Güvenli ödeme",
                  d: "SSL ile şifreli ödeme, havale/EFT ve kart seçenekleri. Faturanız e-posta ile ulaşır.",
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  ),
                },
                {
                  t: "Destek",
                  d: "Teslimat, iade veya ürünle ilgili tüm sorularınızda iletişim formu ve müşteri hizmetlerimiz yanınızda.",
                  icon: (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  ),
                },
              ] as const
            ).map((block) => (
              <div
                key={block.t}
                className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 text-left shadow-sm"
              >
                <div className="text-slate-500">{block.icon}</div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{block.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.d}</p>
              </div>
            ))}
          </div>
        </section>

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
                <li key={p.id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
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
        imageUrl={product.images?.[0]?.url}
      />
      </div>
    </ProductVariantProvider>
  );
}
