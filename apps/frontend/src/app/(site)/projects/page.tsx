import Link from "next/link";
import { apiJsonSafe } from "@/lib/api";

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  gallery?: unknown;
};

export const metadata = { title: "Projeler" };

export default async function ProjectsPage() {
  const list = (await apiJsonSafe<Project[]>("/cms/projects")) ?? [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Portföy
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Tamamlanan işler
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Galeri ve detay metinleri CMS&apos;ten gelir. Her proje müşterinin hikâyesini anlatır.
        </p>
      </div>
      <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 && (
          <li className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500 backdrop-blur">
            Portföy boş — CMS üzerinden proje ekleyin.
          </li>
        )}
        {list.map((p, i) => {
          const cover = Array.isArray(p.gallery)
            ? ((p.gallery as unknown[]).filter((x): x is string => typeof x === "string")[0] ?? null)
            : null;
          return (
            <li key={p.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <Link
                href={`/projects/${p.slug}`}
                className="card-soft group flex h-full flex-col overflow-hidden p-0"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  {cover ? (
                    <div
                      className="hover-zoom absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${cover})` }}
                      role="img"
                      aria-label=""
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      Görsel yok
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
                <div className="p-6">
                  <p className="text-lg font-semibold text-slate-900 group-hover:text-sky-800">
                    {p.title}
                  </p>
                  {p.summary && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {p.summary}
                    </p>
                  )}
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                    Projeyi incele
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>
                      →
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
