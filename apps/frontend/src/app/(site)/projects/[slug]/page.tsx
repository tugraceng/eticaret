import Link from "next/link";
import { notFound } from "next/navigation";
import { apiJson } from "@/lib/api";

type Project = {
  title: string;
  description: string;
  summary?: string | null;
  gallery: unknown;
  completedAt?: string | null;
};

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let p: Project | null = null;
  try {
    p = await apiJson<Project>(`/cms/projects/${slug}`);
  } catch {
    notFound();
  }
  const gallery = Array.isArray(p.gallery)
    ? (p.gallery as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const cover = gallery[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link href="/projects" className="link-underline text-sm text-slate-600 hover:text-slate-900">
        ← Projelere dön
      </Link>

      <div className="mt-6 fade-up">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          {p.title}
        </h1>
        {p.summary && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{p.summary}</p>
        )}
        {p.completedAt && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {new Date(p.completedAt).toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {cover && (
        <div
          className="mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-slate-100 bg-cover bg-center shadow-lg"
          style={{ backgroundImage: `url(${cover})` }}
          role="img"
          aria-label=""
        />
      )}

      <article className="fade-up mx-auto mt-12 max-w-3xl whitespace-pre-wrap text-base leading-[1.75] text-slate-700">
        {p.description}
      </article>

      {gallery.length > 1 && (
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {gallery.slice(1).map((url, i) => (
            <div
              key={url}
              className="fade-up aspect-square overflow-hidden rounded-2xl bg-slate-100 bg-cover bg-center shadow-sm transition-transform duration-500 hover:-translate-y-1 hover:shadow-lg"
              style={{ backgroundImage: `url(${url})`, animationDelay: `${i * 50}ms` }}
              role="img"
              aria-label=""
            />
          ))}
        </div>
      )}
    </div>
  );
}
