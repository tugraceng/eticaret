import Link from "next/link";
import type { ShopCategory } from "@/app/(site)/shop/CategoryStrip";
import { apiAssetUrl, apiJsonSafe } from "@/lib/api";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import type { HomeSection, SiteSettings } from "@/lib/settings";
import { HomeCategoryIconGrid } from "./HomeCategoryIconGrid";
import { HomeCmsHero } from "./HomeCmsHero";
import { HomeCmsPromoBanner } from "./HomeCmsPromoBanner";
import { HomeProductRail } from "./HomeProductRail";
import { HomeStoryStrip } from "./HomeStoryStrip";
import { HomeTrustStrip } from "./HomeTrustStrip";

export type HomeRenderContext = {
  settings: Pick<SiteSettings, "siteName" | "defaultMetaDesc" | "primaryColor" | "secondaryColor">;
  categories: ShopCategory[];
  catalog: {
    bestsellers: ProductCardData[];
    popular: ProductCardData[];
    newest: ProductCardData[];
    /** Yayında ve ürün kartında «öne çıkan» işaretli ürünler (hikâye şeridi vb.). */
    featured: ProductCardData[];
  };
};

function dedupeProductsById(products: ProductCardData[]): ProductCardData[] {
  const seen = new Set<string>();
  const out: ProductCardData[] = [];
  for (const p of products) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

function CatalogRail({
  section,
  products,
  defaultTitle,
  defaultHref,
}: {
  section: HomeSection;
  products: ProductCardData[];
  defaultTitle: string;
  defaultHref: string;
}) {
  if (products.length === 0) return null;
  const railTitle = section.title?.trim() || defaultTitle;
  const href = section.ctaHref?.trim() || defaultHref;
  return (
    <section className="si-section pb-2 pt-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.subtitle ? (
          <p className="si-kicker mb-1">{section.subtitle}</p>
        ) : null}
        <HomeProductRail
          title={railTitle}
          href={href}
          products={products}
          subtitle={section.body?.trim() || null}
        />
      </div>
    </section>
  );
}

type Category = { id: string; name: string; slug: string; description?: string | null };

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

type BannerItem = { title?: string; subtitle?: string; imageUrl?: string; href?: string };
type Testimonial = { quote: string; author?: string; role?: string };

function ctaButton(section: HomeSection, variant: "primary" | "ghost" = "primary") {
  if (!section.ctaLabel || !section.ctaHref) return null;
  return (
    <Link href={section.ctaHref} className={variant === "primary" ? "btn-primary" : "btn-ghost"}>
      {section.ctaLabel}
      <span aria-hidden>→</span>
    </Link>
  );
}

function SectionHeading({
  subtitle,
  title,
  center = false,
  tone = "dark",
}: {
  subtitle?: string | null;
  title?: string | null;
  center?: boolean;
  tone?: "light" | "dark";
}) {
  if (!subtitle && !title) return null;
  const base = center ? "text-center" : "";
  const kickerClass =
    tone === "dark"
      ? "si-kicker"
      : "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500";
  const titleClass =
    tone === "dark"
      ? "si-heading mt-2"
      : "mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl";
  return (
    <div className={`${base} fade-up`}>
      {subtitle && <p className={kickerClass}>{subtitle}</p>}
      {title && <h2 className={titleClass}>{title}</h2>}
    </div>
  );
}

function Banners({ section }: { section: HomeSection }) {
  const items = Array.isArray(section.config?.items)
    ? ((section.config!.items as unknown[]).filter(
        (b): b is BannerItem => typeof b === "object" && b !== null,
      ) as BannerItem[])
    : [];
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle={section.subtitle} title={section.title} />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((b, idx) => {
          const content = (
            <div className="card-soft group fade-up relative flex aspect-[4/3] flex-col justify-end overflow-hidden p-0">
              {b.imageUrl ? (
                <div
                  className="hover-zoom absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${apiAssetUrl(b.imageUrl) ?? b.imageUrl})`,
                  }}
                  aria-hidden
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(168,85,247,0.25))",
                  }}
                  aria-hidden
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent" />
              <div className="relative z-10 p-6 text-white">
                {b.subtitle && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                    {b.subtitle}
                  </p>
                )}
                {b.title && <p className="mt-1.5 text-2xl font-semibold tracking-tight">{b.title}</p>}
                {b.href && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white opacity-90 transition-opacity group-hover:opacity-100">
                    Keşfet <span aria-hidden>→</span>
                  </span>
                )}
              </div>
            </div>
          );
          return b.href ? (
            <Link key={idx} href={b.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={idx}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}

async function FeaturedProducts({ section }: { section: HomeSection }) {
  const ids = Array.isArray(section.config?.productIds)
    ? (section.config!.productIds as unknown[]).filter((i): i is string => typeof i === "string")
    : [];
  let products: ProductCardData[] = [];
  if (ids.length > 0) {
    const list = await apiJsonSafe<ProductCardData[]>(
      `/products?ids=${encodeURIComponent(ids.join(","))}`,
    );
    if (list?.length) {
      const byId = new Map(list.map((p) => [p.id, p]));
      products = ids
        .map((id) => byId.get(id))
        .filter((p): p is ProductCardData => p != null && Boolean(p.isFeatured));
    }
  } else {
    const list = await apiJsonSafe<ProductCardData[]>("/products?featured=1");
    if (list) products = list.slice(0, 6);
  }
  if (products.length === 0) return null;

  return (
    <section className="si-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading subtitle={section.subtitle} title={section.title ?? "Öne çıkan ürünler"} />
        {ctaButton(section, "ghost")}
      </div>
      <ul className="mt-10 grid auto-rows-fr grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="flex min-h-0">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

async function FeaturedCategories({ section }: { section: HomeSection }) {
  const ids = Array.isArray(section.config?.categoryIds)
    ? (section.config!.categoryIds as unknown[]).filter((i): i is string => typeof i === "string")
    : [];
  const all = (await apiJsonSafe<Category[]>("/categories")) ?? [];
  const selected =
    ids.length > 0
      ? ids.map((id) => all.find((c) => c.id === id)).filter((c): c is Category => c != null)
      : all.slice(0, 8);
  if (selected.length === 0) return null;

  return (
    <section className="si-section-alt">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading subtitle={section.subtitle} title={section.title ?? "Kategoriler"} />
          {ctaButton(section, "ghost")}
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {selected.map((c, i) => (
            <li key={c.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <Link
                href={`/?categoryId=${encodeURIComponent(c.id)}#urunler`}
                className="si-category-card group !items-start !p-5 !text-left"
              >
                <span className="si-category-icon text-sm font-semibold">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <p className="text-sm font-semibold text-slate-100">{c.name}</p>
                {c.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{c.description}</p>
                )}
                <p className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                  Keşfet
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function RichText({ section }: { section: HomeSection }) {
  if (!section.title && !section.body) return null;
  return (
    <section className="si-section-alt">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
      <SectionHeading subtitle={section.subtitle} title={section.title} center />
      {section.body && (
        <article className="si-body fade-up mt-8 whitespace-pre-wrap text-center">
          {section.body}
        </article>
      )}
      {section.ctaLabel && section.ctaHref && (
        <div className="fade-up mt-8 flex justify-center">{ctaButton(section)}</div>
      )}
      </div>
    </section>
  );
}

async function BlogTeaser({ section }: { section: HomeSection }) {
  const limit = typeof section.config?.limit === "number" ? (section.config.limit as number) : 3;
  const posts = (await apiJsonSafe<BlogPost[]>("/cms/blog")) ?? [];
  const list = posts.slice(0, limit);
  if (list.length === 0) return null;

  return (
    <section className="si-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading subtitle={section.subtitle} title={section.title ?? "Blog"} />
        {ctaButton(section, "ghost")}
      </div>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {list.map((p, i) => (
          <li key={p.id} className="fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <Link
              href={`/blog/${p.slug}`}
              className="card-soft group flex h-full flex-col p-6"
            >
              {p.publishedAt && (
                <p className="si-kicker !text-[10px]">
                  {new Date(p.publishedAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <p className="mt-2 text-lg font-semibold leading-snug text-slate-100 group-hover:text-sky-300">
                {p.title}
              </p>
              {p.excerpt && (
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-400">
                  {p.excerpt}
                </p>
              )}
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                Oku
                <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>
                  →
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

function Testimonials({ section }: { section: HomeSection }) {
  const items = Array.isArray(section.config?.items)
    ? ((section.config!.items as unknown[]).filter(
        (t): t is Testimonial =>
          typeof t === "object" && t !== null && typeof (t as Testimonial).quote === "string",
      ) as Testimonial[])
    : [];
  if (items.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(1100px circle at 20% 0%, rgba(56,189,248,0.22), transparent 50%), radial-gradient(900px circle at 80% 100%, rgba(168,85,247,0.22), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle={section.subtitle}
          title={section.title ?? "Müşterilerimiz ne diyor?"}
          tone="dark"
        />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((t, idx) => (
            <li
              key={idx}
              className="fade-up rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-transform duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-sky-300" fill="currentColor" aria-hidden>
                <path d="M7 7h4v4H7c0 2 1 3 3 3v3c-4 0-6-2-6-6V7zm10 0h4v4h-4c0 2 1 3 3 3v3c-4 0-6-2-6-6V7z" />
              </svg>
              <p className="mt-3 text-sm leading-relaxed text-slate-100">{t.quote}</p>
              {(t.author || t.role) && (
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-sky-300">
                  {t.author}
                  {t.role ? ` · ${t.role}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CTA({ section }: { section: HomeSection }) {
  return (
    <section className="si-section pb-8 pt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        className="relative isolate overflow-hidden rounded-3xl px-6 py-14 text-white shadow-xl sm:px-12"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
        }}
      >
        <div
          className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06] blur-2xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-black/15 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="fade-up">
            {section.subtitle && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {section.subtitle}
              </p>
            )}
            {section.title && (
              <h2 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {section.title}
              </h2>
            )}
            {section.body && (
              <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">{section.body}</p>
            )}
          </div>
          {section.ctaLabel && section.ctaHref && (
            <Link
              href={section.ctaHref}
              className="fade-up inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-transform duration-300 ease-spring hover:-translate-y-0.5 hover:scale-[1.03]"
            >
              {section.ctaLabel}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}

export async function HomeSectionRenderer({
  section,
  ctx,
}: {
  section: HomeSection;
  ctx: HomeRenderContext;
}) {
  switch (section.kind) {
    case "HERO":
      return <HomeCmsHero section={section} settings={ctx.settings} />;
    case "TRUST_STRIP":
      return <HomeTrustStrip items={section.config?.items} />;
    case "CATEGORY_ICONS":
      return (
        <HomeCategoryIconGrid
          categories={ctx.categories}
          kicker={section.subtitle?.trim() || undefined}
          heading={section.title?.trim() || undefined}
          description={section.body?.trim() || undefined}
        />
      );
    case "RAIL_BESTSELLERS":
      return (
        <CatalogRail
          section={section}
          products={ctx.catalog.bestsellers}
          defaultTitle="Öne çıkanlar"
          defaultHref="/shop"
        />
      );
    case "RAIL_POPULAR":
      return (
        <CatalogRail
          section={section}
          products={ctx.catalog.popular}
          defaultTitle="Trend / popüler"
          defaultHref="/shop"
        />
      );
    case "RAIL_NEWEST":
      return (
        <CatalogRail
          section={section}
          products={ctx.catalog.newest}
          defaultTitle="Yeni gelenler"
          defaultHref="/shop"
        />
      );
    case "STORY_STRIP": {
      const unique = dedupeProductsById(ctx.catalog.featured);
      return (
        <HomeStoryStrip
          products={unique}
          kicker={section.subtitle?.trim() || undefined}
          heading={section.title?.trim() || undefined}
          subheading={section.body?.trim() || undefined}
        />
      );
    }
    case "PROMO_BANNER":
      return (
        <HomeCmsPromoBanner
          eyebrow={section.subtitle?.trim() || undefined}
          title={section.title?.trim() || "Hızlı teslimat, güvenli ödeme"}
          body={section.body?.trim() || undefined}
          ctaLabel={section.ctaLabel?.trim() || "Mağazaya git"}
          ctaHref={section.ctaHref?.trim() || "/shop"}
        />
      );
    case "PRODUCT_CATALOG":
      return null;
    case "BANNERS":
      return <Banners section={section} />;
    case "FEATURED_PRODUCTS":
      return await FeaturedProducts({ section });
    case "FEATURED_CATEGORIES":
      return await FeaturedCategories({ section });
    case "RICH_TEXT":
      return <RichText section={section} />;
    case "BLOG_TEASER":
      return await BlogTeaser({ section });
    case "TESTIMONIALS":
      return <Testimonials section={section} />;
    case "CTA":
      return <CTA section={section} />;
    default:
      return null;
  }
}
