import { redirect } from "next/navigation";

/** Eski /projects/[slug] linkleri tek sayfaya yönlendirilir. */
export default async function ProjectDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/projects?h=${encodeURIComponent(slug)}`);
}
