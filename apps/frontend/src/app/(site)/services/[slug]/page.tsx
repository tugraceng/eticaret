import { redirect } from "next/navigation";

/** Eski /services/[slug] linkleri tek sayfaya yönlendirilir. */
export default async function ServiceDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/services?h=${encodeURIComponent(slug)}`);
}
