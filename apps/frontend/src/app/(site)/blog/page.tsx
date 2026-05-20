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
          <li className="si-empty-state col-span-full">Henüz yazı yok — panelden blog kaydı oluşturup yayınlayın.</li>
        )}
        {posts.map((p, i) => (
          <li key={p.id} className="fade-up flex" style={{ animationDelay: `${i * 60}ms` }}>
            <Link href={`/blog/${p.slug}`} className="card-soft group flex h-full min-h-[200px] w-full flex-col p-6">
              {p.publishedAt && (
                <p className="si-kicker !text-[11px] !tracking-widest">
                  {new Date(p.publishedAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <p className="si-blog-card-title">{p.title}</p>
              {p.excerpt ? (
                <p className="si-body mt-2 line-clamp-3 flex-1">{p.excerpt}</p>
              ) : (
                <span className="flex-1" />
              )}
              <p className="si-blog-card-cta">
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
