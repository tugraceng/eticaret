import Link from "next/link";
import { notFound } from "next/navigation";
import { apiJson } from "@/lib/api";

type Service = { title: string; description: string; summary: string | null };

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let s: Service | null = null;
  try {
    s = await apiJson<Service>(`/cms/services/${slug}`);
  } catch {
    notFound();
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/services" className="link-underline text-sm text-slate-600 hover:text-slate-900">
        ← Hizmetlere dön
      </Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        {s.title}
      </h1>
      {s.summary && <p className="mt-4 text-lg leading-relaxed text-slate-600">{s.summary}</p>}
      <article className="fade-up mt-10 whitespace-pre-wrap text-base leading-[1.75] text-slate-700">
        {s.description}
      </article>
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/contact" className="btn-primary">
          Teklif al <span aria-hidden>→</span>
        </Link>
        <Link href="/services" className="btn-ghost">
          Tüm hizmetler
        </Link>
      </div>
    </div>
  );
}
