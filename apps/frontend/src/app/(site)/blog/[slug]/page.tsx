import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { apiJson } from "@/lib/api";
import { PageContainer } from "@/components/site/PageContainer";

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
    <PageContainer as="article" width="narrow" className="py-12 sm:py-16">
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
      <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {post.title}
      </h1>
      {post.excerpt ? <p className="mt-4 text-base text-slate-600">{post.excerpt}</p> : null}

      {post.coverImageUrl ? (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={post.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            quality={80}
            priority
          />
        </div>
      ) : null}

      <div className="prose prose-slate mt-10 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {post.body}
      </div>
    </PageContainer>
  );
}
