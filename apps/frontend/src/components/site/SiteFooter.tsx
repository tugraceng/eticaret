import Link from "next/link";
import Image from "next/image";
import type { SiteSettings } from "@/lib/settings";
import { siteContainerClass } from "@/components/site/PageContainer";
import { cn } from "@/lib/cn";
import { SiteFooterNewsletter } from "./SiteFooterNewsletter";
import { SocialNetworkIcon } from "./SocialNetworkIcon";

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

function footerColumns(settings: SiteSettings) {
  const contactHref = settings.contactNavHref?.trim() || "/contact";
  const contactLabel = settings.contactNavLabel?.trim() || "Bize ulaşın";
  return {
    Kurumsal: [
      { href: "/about", label: "Hakkımızda" },
      { href: "/services", label: "Hizmetler" },
      { href: "/projects", label: "Projeler" },
      { href: "/blog", label: "Blog" },
      { href: contactHref, label: contactLabel },
    ],
    Mağaza: [
      { href: "/shop", label: "Ürünler" },
      { href: "/#urunler", label: "Öne çıkanlar" },
      { href: "/cart", label: "Sepet" },
      { href: "/favoriler", label: "Favoriler" },
      { href: "/checkout", label: "Ödeme" },
      { href: "/hesap", label: "Hesabım" },
    ],
    Destek: [
      { href: contactHref, label: "Destek" },
      { href: "/teslimat-iade", label: "Kargo ve iade" },
      { href: "/hesap/iadeler", label: "İadelerim" },
    ],
    Yasal: [
      { href: "/kvkk", label: "KVKK" },
      { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli satış" },
      { href: "/gizlilik", label: "Gizlilik" },
      { href: "/teslimat-iade", label: "Teslimat şartları" },
    ],
  };
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const columns = footerColumns(settings);
  const contactHref = settings.contactNavHref?.trim() || "/contact";
  const contactLabel = settings.contactNavLabel?.trim() || "Bize ulaşın";
  const social = Object.entries(settings.socialLinks ?? {}).filter(
    ([, href]) => typeof href === "string" && href.trim().length > 0,
  );
  const year = new Date().getFullYear();

  return (
    <footer
      id="site-footer"
      className="mt-auto border-t border-neutral-200 bg-white pb-[calc(4.75rem+env(safe-area-inset-bottom))] text-neutral-900 md:pb-0"
    >
      <div className={cn(siteContainerClass, "py-14")}>
        <div className="flex flex-col gap-10 border-b border-neutral-200 pb-12 md:flex-row md:items-start md:justify-between md:gap-16">
          <div className="max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
              İç çember
            </p>
            <h2 className="mt-3 text-xl font-medium tracking-tight md:text-2xl">E-bültene katılın</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Kampanyalar ve yeni ürünlerden önce haberdar olun.
            </p>
          </div>
          <SiteFooterNewsletter />
        </div>
        <p className="mt-4 text-[11px] text-neutral-400">
          Abone olarak gizlilik politikasını kabul etmiş olursunuz. İstediğiniz zaman ayrılabilirsiniz.
        </p>

        <div className="mt-16 grid gap-12 md:grid-cols-12">
          <div id="footer-brand" className="scroll-mt-28 md:col-span-5">
            <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-6 sm:p-7">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900"
              >
                {settings.logoUrl ? (
                  <Image
                    src={settings.logoUrl}
                    alt={settings.siteName}
                    width={160}
                    height={96}
                    className="h-[5.5rem] w-auto object-contain sm:h-24"
                    quality={80}
                    sizes="160px"
                  />
                ) : (
                  <span className="text-xl font-semibold uppercase tracking-[0.12em]">{settings.siteName}</span>
                )}
              </Link>
              {settings.defaultMetaDesc ? (
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">{settings.defaultMetaDesc}</p>
              ) : null}

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">İletişim</p>
              {settings.contactEmail || settings.contactPhone || settings.address?.trim() ? (
                <div className="mt-2 space-y-2 text-sm text-neutral-600">
                  {settings.contactEmail ? (
                    <p>
                      <a className="font-medium text-neutral-800 hover:text-neutral-950" href={`mailto:${settings.contactEmail}`}>
                        {settings.contactEmail}
                      </a>
                    </p>
                  ) : null}
                  {settings.contactPhone ? (
                    <p>
                      <a className="font-medium text-neutral-800 hover:text-neutral-950" href={`tel:${settings.contactPhone}`}>
                        {settings.contactPhone}
                      </a>
                    </p>
                  ) : null}
                  {settings.address?.trim() ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-neutral-600">{settings.address.trim()}</p>
                  ) : null}
                </div>
              ) : null}
              <Link
                href={contactHref}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
              >
                {contactLabel}
                <span aria-hidden>→</span>
              </Link>

              {social.length > 0 ? (
                <>
                  <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Sosyal</p>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {social.map(([key, href]) => {
                      const label = socialLabels[key.toLowerCase()] ?? key;
                      return (
                        <a
                          key={key}
                          href={href as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={label}
                          aria-label={label}
                          className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-900 hover:text-neutral-900"
                        >
                          <SocialNetworkIcon kind={key} className="h-[19px] w-[19px]" />
                        </a>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4 md:col-span-7">
            {Object.entries(columns).map(([title, items]) => (
              <div key={title}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">{title}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {items.map((i) => (
                    <li key={i.href}>
                      <Link href={i.href} className="text-neutral-600 transition hover:text-neutral-950">
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-neutral-200 pt-8 text-[11px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.siteName}. Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-center">
            <span className="text-neutral-400">İyzico</span>
            <span className="text-neutral-300">·</span>
            <span>VISA</span>
            <span className="text-neutral-300">·</span>
            <span>MASTERCARD</span>
            <span className="text-neutral-300">·</span>
            <span>TROY</span>
          </div>
          <a
            href="https://tgrsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium tracking-wide text-neutral-400/75 transition hover:text-neutral-600 max-sm:self-end sm:text-right"
          >
            tgrsoft
          </a>
        </div>
      </div>
    </footer>
  );
}
