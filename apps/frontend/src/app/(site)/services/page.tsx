import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { apiAssetUrl, apiJsonSafe } from "@/lib/api";
import { CmsAnchorScroll } from "@/components/site/CmsAnchorScroll";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";

type Service = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  iconUrl?: string | null;
  sortOrder?: number;
};

type CmsPage = { title: string; content: unknown };

function contentRecord(content: unknown): Record<string, unknown> | null {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  return null;
}

export const metadata = { title: "Hizmetler" };

export default async function ServicesPage() {
  const [listRaw, landing] = await Promise.all([
    apiJsonSafe<Service[]>("/cms/services"),
    apiJsonSafe<CmsPage>("/cms/pages/services-index"),
  ]);
  const services = (listRaw ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const c = contentRecord(landing?.content);
  const eyebrow =
    typeof c?.eyebrow === "string" && c.eyebrow.trim() ? c.eyebrow.trim() : "Ne sunuyoruz";
  const intro =
    typeof c?.intro === "string" && c.intro.trim()
      ? c.intro.trim()
      : "Aşağıda tüm hizmetlerimizi görsellerle birlikte tek sayfada bulabilirsiniz. Özel paket ve teklif için iletişime geçin.";

  return (
    <PageContainer className="py-12 sm:py-16">
      <Suspense fallback={null}>
        <CmsAnchorScroll />
      </Suspense>

      <PageHeader eyebrow={eyebrow} title={landing?.title?.trim() || "Hizmetler"} description={intro} />

      <div className="mt-14 space-y-20 sm:space-y-24">
        {services.length === 0 && (
          <div className="si-empty-state">
            Henüz hizmet yok — yönetim panelinden CMS → Hizmet ile ekleyin.
          </div>
        )}
        {services.map((s, i) => {
          const cover = apiAssetUrl(s.iconUrl ?? undefined);
          return (
            <section
              key={s.id}
              id={s.slug}
              className="si-cms-section fade-up sm:scroll-mt-32"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              {cover ? (
                <div className="si-cms-media relative aspect-[2/1] max-h-[min(52vw,380px)] w-full sm:aspect-[21/9]">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 896px"
                    quality={i === 0 ? 80 : 70}
                    priority={i === 0}
                  />
                </div>
              ) : (
                <div
                  className="flex aspect-[2/1] max-h-[min(40vw,280px)] w-full items-center justify-center rounded-3xl text-4xl font-semibold text-white shadow-inner sm:aspect-[21/9]"
                  style={{
                    backgroundImage: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                  }}
                  aria-hidden
                >
                  {s.title.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h2 className="si-cms-block-title mt-8">{s.title}</h2>
              {s.summary ? <p className="si-cms-lead mt-3">{s.summary}</p> : null}
              <article className="si-cms-prose mt-8">{s.description}</article>
            </section>
          );
        })}
      </div>

      <div className="si-cms-divider">
        <Link href="/contact" className="btn-primary">
          Teklif al <span aria-hidden>→</span>
        </Link>
        <Link href="/" className="btn-ghost">
          Ana sayfa
        </Link>
      </div>
    </PageContainer>
  );
}
