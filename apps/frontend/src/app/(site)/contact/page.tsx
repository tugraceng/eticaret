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
    <PageContainer className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }} />
      <PageHeader
        eyebrow="Bize ulaşın"
        title="İletişim"
        description="Soru, teklif veya işbirliği için formu doldurun veya aşağıdaki kanallardan bize ulaşın."
      />

      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="si-page-card grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-1">
            {settings.contactPhone?.trim() ? (
              <div>
                <p className="si-kicker !text-[10px]">Telefon</p>
                <a
                  href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                  className="mt-1 block text-base font-semibold text-slate-100 hover:text-sky-300"
                >
                  {settings.contactPhone}
                </a>
              </div>
            ) : null}
            {settings.contactEmail?.trim() ? (
              <div>
                <p className="si-kicker !text-[10px]">E-posta</p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="mt-1 block break-all text-base font-semibold text-slate-100 hover:text-sky-300"
                >
                  {settings.contactEmail}
                </a>
              </div>
            ) : null}
            {settings.address?.trim() ? (
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="si-kicker !text-[10px]">Adres</p>
                <p className="si-body mt-1">{settings.address}</p>
              </div>
            ) : null}
          </div>

          {socialEntries.length > 0 ? (
            <div className="si-page-card p-5 sm:p-6">
              <p className="si-kicker !text-[10px]">Sosyal medya</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {socialEntries.map(([key, url]) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-500/40 hover:text-sky-300"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="si-page-card overflow-hidden">
            <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#1a222e] to-[#121212]">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="si-kicker !text-[10px]">Konum</p>
                {settings.address?.trim() ? (
                  <p className="si-body mt-2 max-w-xs">{settings.address}</p>
                ) : (
                  <p className="si-body mt-2">Adres bilgisi ayarlardan eklenebilir.</p>
                )}
                {settings.address?.trim() ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-sm font-semibold text-sky-400 hover:text-sky-300"
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

      <p className="si-body mt-8 text-center text-xs">
        Mağaza politikaları için{" "}
        <Link href="/kvkk" className="font-medium text-sky-400/90 hover:text-sky-300 hover:underline">
          KVKK
        </Link>{" "}
        sayfasına göz atabilirsiniz.
      </p>
    </PageContainer>
  );
}
