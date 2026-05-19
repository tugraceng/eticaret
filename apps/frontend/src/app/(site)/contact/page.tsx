import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/site/ContactForm";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";
import { getSiteSettings } from "@/lib/settings";
import { breadcrumbJsonLd, buildPageMetadata, localBusinessJsonLd, seoExcerpt } from "@/lib/seo";
import { getMetadataBase } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = seoExcerpt(
    settings.contactMetaDesc?.trim() ||
      settings.defaultMetaDesc?.trim() ||
      `${settings.siteName} iletişim — telefon, e-posta ve adres bilgileri.`,
  );
  return buildPageMetadata({
    title: settings.contactMetaTitle?.trim() || "İletişim",
    description,
    path: "/contact",
    siteOgImage: settings.contactOgImageUrl ?? settings.ogImageUrl,
    fields: {
      metaTitle: settings.contactMetaTitle,
      metaDescription: settings.contactMetaDesc,
      seoKeywords: settings.contactSeoKeywords,
      seoCanonicalUrl: settings.contactCanonicalUrl,
      seoOgImageUrl: settings.contactOgImageUrl,
      seoNoIndex: settings.contactNoIndex,
    },
  });
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const social = settings.socialLinks ?? {};
  const socialEntries = Object.entries(social).filter(([, url]) => typeof url === "string" && url.trim());
  const base = getMetadataBase().toString().replace(/\/$/, "");
  const localLd = localBusinessJsonLd(settings);
  const crumbsLd = breadcrumbJsonLd([
    { name: "Ana sayfa", item: base },
    { name: "İletişim", item: `${base}/contact` },
  ]);

  return (
    <PageContainer className="py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }} />
      <PageHeader
        eyebrow="Bize ulaşın"
        title="İletişim"
        description="Soru, teklif veya işbirliği için formu doldurun veya aşağıdaki kanallardan bize ulaşın."
      />

      <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="flex flex-col gap-4">
          <div className="card-soft grid gap-4 p-6 sm:grid-cols-2 sm:p-7 lg:grid-cols-1">
            {settings.contactPhone?.trim() ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Telefon</p>
                <a
                  href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                  className="mt-1 block text-base font-semibold text-slate-900 hover:text-sky-700"
                >
                  {settings.contactPhone}
                </a>
              </div>
            ) : null}
            {settings.contactEmail?.trim() ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">E-posta</p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="mt-1 block break-all text-base font-semibold text-slate-900 hover:text-sky-700"
                >
                  {settings.contactEmail}
                </a>
              </div>
            ) : null}
            {settings.address?.trim() ? (
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Adres</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{settings.address}</p>
              </div>
            ) : null}
          </div>

          {socialEntries.length > 0 ? (
            <div className="card-soft p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sosyal medya</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {socialEntries.map(([key, url]) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-sky-200 hover:text-sky-800"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card-soft overflow-hidden">
            <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-slate-100 to-slate-200">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Konum</p>
                {settings.address?.trim() ? (
                  <p className="mt-2 max-w-xs text-sm text-slate-700">{settings.address}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Adres bilgisi ayarlardan eklenebilir.</p>
                )}
                {settings.address?.trim() ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-sm font-semibold text-sky-700 hover:underline"
                  >
                    Haritada aç
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Mağaza politikaları için{" "}
        <Link href="/kvkk" className="font-medium text-slate-700 hover:underline">
          KVKK
        </Link>{" "}
        sayfasına göz atabilirsiniz.
      </p>
    </PageContainer>
  );
}
