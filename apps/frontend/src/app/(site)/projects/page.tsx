import { Suspense } from "react";
import { apiAssetUrl, apiJsonSafe } from "@/lib/api";
import { CmsAnchorScroll } from "@/components/site/CmsAnchorScroll";

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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Suspense fallback={null}>
        <CmsAnchorScroll />
      </Suspense>

      <header className="fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Portföy</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Tamamlanan işler</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Projeler tek sayfada görseller ve açıklamalarla listelenir. Detaylı inceleme için aşağı kaydırın.
        </p>
      </header>

      <div className="mt-14 space-y-20 sm:space-y-24">
        {list.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500 backdrop-blur">
            Portföy boş — CMS üzerinden proje ekleyin.
          </div>
        )}
        {list.map((p, i) => {
          const urls = galleryUrls(p.gallery).map((u) => apiAssetUrl(u) ?? u);
          const cover = urls[0];
          const rest = urls.slice(1);
          return (
            <section
              key={p.id}
              id={p.slug}
              className="fade-up scroll-mt-28 border-b border-slate-200/80 pb-20 last:border-0 last:pb-0 sm:scroll-mt-32"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              {cover ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm ring-1 ring-slate-200/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                </div>
              ) : (
                <div className="grid aspect-[16/9] w-full place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  Görsel yok
                </div>
              )}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{p.title}</h2>
                {p.completedAt ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {new Date(p.completedAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                  </p>
                ) : null}
              </div>
              {p.summary ? (
                <p className="mt-3 text-lg leading-relaxed text-slate-600">{p.summary}</p>
              ) : null}
              <article className="mt-8 whitespace-pre-wrap text-base leading-[1.75] text-slate-700">{p.description}</article>
              {rest.length > 0 ? (
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {rest.map((url) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
