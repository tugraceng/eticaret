import type { Metadata } from "next";
import Link from "next/link";
import { apiJsonSafe } from "@/lib/api";
import { getSiteSettings } from "@/lib/settings";
import { buildPageMetadata, breadcrumbJsonLd, organizationJsonLd, seoExcerpt } from "@/lib/seo";
import { getMetadataBase } from "@/lib/site-url";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";
import { cn } from "@/lib/cn";

type CmsPage = {
  title: string;
  content: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgImageUrl?: string | null;
  seoNoIndex?: boolean;
};

const defaultPillars = [
  {
    icon: "🎯",
    title: "Misyon",
    body: "Müşterilerimize kaliteli ürünler sunmak ve üstün bir alışveriş deneyimi yaşatmak.",
  },
  {
    icon: "🌱",
    title: "Vizyon",
    body: "Sektörümüzde öncü ve yenilikçi bir marka olarak müşteri memnuniyetini en üst seviyede tutmak.",
  },
  {
    icon: "🤝",
    title: "Değerler",
    body: "Şeffaflık, güvenilirlik ve sürekli iyileşme. Her kararı müşteri değeri üzerinden alıyoruz.",
  },
];

function contentRecord(content: unknown): Record<string, unknown> | null {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  return null;
}

function readPillars(raw: unknown): typeof defaultPillars {
  if (!Array.isArray(raw)) return defaultPillars;
  const out: typeof defaultPillars = [];
  for (const p of raw) {
    if (!p || typeof p !== "object" || Array.isArray(p)) continue;
    const o = p as Record<string, unknown>;
    const icon = typeof o.icon === "string" ? o.icon : "•";
    const title = typeof o.title === "string" ? o.title : "";
    const body = typeof o.body === "string" ? o.body : "";
    if (!title.trim() || !body.trim()) continue;
    out.push({ icon, title: title.trim(), body: body.trim() });
  }
  return out.length > 0 ? (out as typeof defaultPillars) : defaultPillars;
}

const defaultBizKimiz = {
  title: "Ekibimiz ve yaklaşımımız",
  body: "Deneyimli bir ekiple ürün, tasarım ve operasyonu bir arada düşünüyoruz. Şeffaf iletişim ve ölçülebilir teslimatlarla mağazanızın büyümesine odaklanıyoruz.",
};

function readBizKimiz(raw: unknown): { title: string; body: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaultBizKimiz;
  const o = raw as Record<string, unknown>;
  const title =
    typeof o.title === "string" && o.title.trim() ? o.title.trim() : defaultBizKimiz.title;
  const body =
    typeof o.body === "string" && o.body.trim() ? o.body.trim() : defaultBizKimiz.body;
  return { title, body };
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    apiJsonSafe<CmsPage>("/cms/pages/about"),
    getSiteSettings(),
  ]);
  const c = page?.content && typeof page.content === "object" && !Array.isArray(page.content)
    ? (page.content as Record<string, unknown>)
    : null;
  const lead =
    typeof c?.lead === "string" && c.lead.trim()
      ? c.lead.trim()
      : "Küçük ve orta ölçekli işletmeler için modern e-ticaret ve kurumsal vitrin çözümü sunuyoruz.";
  return buildPageMetadata({
    title: page?.title?.trim() || "Hakkımızda",
    description: seoExcerpt(lead),
    path: "/about",
    siteOgImage: settings.ogImageUrl,
    fields: page
      ? {
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          seoKeywords: page.seoKeywords,
          seoCanonicalUrl: page.seoCanonicalUrl,
          seoOgImageUrl: page.seoOgImageUrl,
          seoNoIndex: page.seoNoIndex,
        }
      : null,
  });
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([
    apiJsonSafe<CmsPage>("/cms/pages/about"),
    getSiteSettings(),
  ]);
  const base = getMetadataBase().toString().replace(/\/$/, "");
  const orgLd = organizationJsonLd(settings);
  const crumbsLd = breadcrumbJsonLd([
    { name: "Ana sayfa", item: base },
    { name: page?.title?.trim() || "Hakkımızda", item: `${base}/about` },
  ]);
  const c = contentRecord(page?.content);
  const lead =
    typeof c?.lead === "string" && c.lead.trim()
      ? c.lead.trim()
      : "Küçük ve orta ölçekli işletmeler için modern e-ticaret ve kurumsal vitrin çözümü sunuyoruz. Amacımız, markanızı güçlü bir dijital hikâyeye dönüştürmek.";
  const pillars = readPillars(c?.pillars);
  const bizKimiz = readBizKimiz(c?.bizKimiz);
  const body = typeof c?.body === "string" && c.body.trim() ? c.body.trim() : null;
  const contactHref = settings.contactNavHref?.trim() || "/contact";

  return (
    <PageContainer className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }} />
      <PageHeader eyebrow="Kurumsal" title={page?.title ?? "Hakkımızda"} description={lead} />

      <section id="biz-kimiz" className={cn("si-page-card fade-up scroll-mt-28 mt-8 p-6 sm:mt-10 sm:p-8")}>
        <p className="si-kicker">Biz kimiz</p>
        <h2 className="si-heading mt-2 text-xl sm:text-2xl">{bizKimiz.title}</h2>
        <p className="si-body mt-3 max-w-3xl">{bizKimiz.body}</p>
      </section>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <li
            key={`${i}-${p.title}`}
            className="si-page-card fade-up flex min-h-[200px] flex-col p-5 sm:p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-2xl" aria-hidden>
              {p.icon}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-100">{p.title}</h3>
            <p className="si-body mt-2 flex-1">{p.body}</p>
          </li>
        ))}
      </ul>

      {body ? (
        <article className="si-page-card fade-up mt-8 p-6 sm:mt-10 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-100">Detaylar</h2>
          <div className="si-body mt-4 whitespace-pre-wrap">{body}</div>
        </article>
      ) : (
        <div className="si-page-cta fade-up mt-8 rounded-2xl p-6 sm:mt-10 sm:p-8">
          <h2 className="si-heading text-xl sm:text-2xl">Bizimle çalışmak ister misiniz?</h2>
          <p className="si-body mt-2 max-w-xl">
            İletişim formumuz üzerinden bize ulaşın; size en kısa sürede dönelim.
          </p>
          <Link href={contactHref} className="si-btn-primary mt-6">
            İletişime geç
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
