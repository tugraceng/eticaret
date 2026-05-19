import Link from "next/link";
import { apiJsonSafe } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = (await apiJsonSafe<Post[]>("/cms/blog")) ?? [];

  return (
    <PageContainer className="py-12 sm:py-16">
      <PageHeader
        eyebrow="Yayınlar"
        title="Blog"
        description="Ürünler, sektör ve dijital strateji üzerine yazılar."
      />

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:gap-6">
        {posts.length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">
            Henüz yazı yok — panelden blog kaydı oluşturup yayınlayın.
          </li>
        )}
        {posts.map((p, i) => (
          <li key={p.id} className="fade-up flex" style={{ animationDelay: `${i * 60}ms` }}>
            <Link href={`/blog/${p.slug}`} className="card-soft group flex h-full min-h-[200px] w-full flex-col p-6">
              {p.publishedAt && (
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {new Date(p.publishedAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <p className="mt-2 text-xl font-semibold leading-snug text-slate-900 group-hover:text-sky-800">
                {p.title}
              </p>
              {p.excerpt ? (
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{p.excerpt}</p>
              ) : (
                <span className="flex-1" />
              )}
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                Oku
                <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>
                  →
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
