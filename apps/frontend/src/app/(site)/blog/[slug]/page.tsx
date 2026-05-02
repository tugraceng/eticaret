import Link from "next/link";
import { notFound } from "next/navigation";
import { apiJson } from "@/lib/api";

type Post = {
  title: string;
  body: string;
  excerpt: string | null;
  publishedAt?: string | null;
  coverImageUrl?: string | null;
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: Post | null = null;
  try {
    post = await apiJson<Post>(`/cms/blog/${slug}`);
  } catch {
    notFound();
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/blog" className="link-underline text-sm text-slate-600 hover:text-slate-900">
        ← Bloga dön
      </Link>

      {post.publishedAt && (
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {new Date(post.publishedAt).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
        {post.title}
      </h1>
      {post.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>
      )}

      {post.coverImageUrl && (
        <div
          className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-slate-100 bg-cover bg-center shadow-lg"
          style={{ backgroundImage: `url(${post.coverImageUrl})` }}
          role="img"
          aria-label=""
        />
      )}

      <article className="fade-up mt-10 whitespace-pre-wrap text-base leading-[1.75] text-slate-700">
        {post.body}
      </article>
    </div>
  );
}
