import Image from "next/image";
import { Suspense } from "react";
import { apiAssetUrl, apiJsonSafe } from "@/lib/api";
import { CmsAnchorScroll } from "@/components/site/CmsAnchorScroll";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  gallery?: unknown;
  completedAt?: string | null;
};

function galleryUrls(gallery: unknown): string[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.filter((x): x is string => typeof x === "string");
}

export const metadata = { title: "Projeler" };

export default async function ProjectsPage() {
  const list = ((await apiJsonSafe<Project[]>("/cms/projects")) ?? []).slice();

  return (
    <PageContainer className="py-12 sm:py-16">
      <Suspense fallback={null}>
        <CmsAnchorScroll />
      </Suspense>

      <PageHeader
        eyebrow="Portföy"
        title="Tamamlanan işler"
        description="Projeler tek sayfada görseller ve açıklamalarla listelenir. Detaylı inceleme için aşağı kaydırın."
      />

      <div className="mt-14 space-y-20 sm:space-y-24">
        {list.length === 0 && (
          <div className="si-empty-state">Portföy boş — CMS üzerinden proje ekleyin.</div>
        )}
        {list.map((p, i) => {
          const urls = galleryUrls(p.gallery).map((u) => apiAssetUrl(u) ?? u);
          const cover = urls[0];
          const rest = urls.slice(1);
          return (
            <section
              key={p.id}
              id={p.slug}
              className="si-cms-section fade-up sm:scroll-mt-32"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              {cover ? (
                <div className="si-cms-media relative aspect-[16/9] w-full">
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
                <div className="si-empty-state grid aspect-[16/9] w-full place-items-center !p-6 text-sm">
                  Görsel yok
                </div>
              )}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="si-cms-block-title">{p.title}</h2>
                {p.completedAt ? (
                  <p className="si-kicker !text-[11px] !tracking-[0.22em]">
                    {new Date(p.completedAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                  </p>
                ) : null}
              </div>
              {p.summary ? <p className="si-cms-lead mt-3">{p.summary}</p> : null}
              <article className="si-cms-prose mt-8">{p.description}</article>
              {rest.length > 0 ? (
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {rest.map((url) => (
                    <div key={url} className="si-cms-media relative aspect-square overflow-hidden rounded-2xl">
                      <Image src={url} alt="" fill className="object-cover" sizes="200px" quality={65} loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </PageContainer>
  );
}
