import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/site/PageContainer";
import { getSiteSettings } from "@/lib/settings";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Sayfa bulunamadı",
    description: `${settings.siteName} — aradığınız sayfa bulunamadı. Ana sayfaya veya mağazaya dönebilirsiniz.`,
    path: "/404",
    siteOgImage: settings.ogImageUrl,
    fields: { seoNoIndex: true },
  });
}

export default function NotFoundPage() {
  return (
    <PageContainer className="py-16 sm:py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Sayfa bulunamadı
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
        Aradığınız adres taşınmış, kaldırılmış veya hiç var olmamış olabilir. Aşağıdaki bağlantılarla
        alışverişe devam edebilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Ana sayfa
        </Link>
        <Link href="/shop" className="btn-ghost">
          Mağaza
        </Link>
        <Link href="/contact" className="btn-ghost">
          İletişim
        </Link>
      </div>
    </PageContainer>
  );
}
