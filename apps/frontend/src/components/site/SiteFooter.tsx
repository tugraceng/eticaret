import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";
import { SiteFooterNewsletter } from "./SiteFooterNewsletter";

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const columns = {
  Kurumsal: [
    { href: "/about", label: "Hakkımızda" },
    { href: "/services", label: "Hizmetler" },
    { href: "/projects", label: "Projeler" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Bize ulaşın" },
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
    { href: "/contact", label: "Destek" },
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

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const social = Object.entries(settings.socialLinks ?? {}).filter(
    ([, href]) => typeof href === "string" && href.trim().length > 0,
  );
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 md:px-12 lg:px-16">
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
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt={settings.siteName} className="h-8 w-auto object-contain" />
              ) : (
                <span className="text-xl font-semibold uppercase tracking-[0.12em]">{settings.siteName}</span>
              )}
            </Link>
            {settings.defaultMetaDesc ? (
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-500">{settings.defaultMetaDesc}</p>
            ) : null}
            <div className="mt-5 space-y-1 text-sm text-neutral-500">
              {settings.contactEmail ? (
                <p>
                  <a className="hover:text-neutral-900" href={`mailto:${settings.contactEmail}`}>
                    {settings.contactEmail}
                  </a>
                </p>
              ) : null}
              {settings.contactPhone ? (
                <p>
                  <a className="hover:text-neutral-900" href={`tel:${settings.contactPhone}`}>
                    {settings.contactPhone}
                  </a>
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {social.map(([key, href]) => (
                <a
                  key={key}
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-[10px] font-semibold uppercase text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                >
                  {(socialLabels[key.toLowerCase()] ?? key).slice(0, 2)}
                </a>
              ))}
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-400">İyzico</span>
            <span className="text-neutral-300">·</span>
            <span>VISA</span>
            <span className="text-neutral-300">·</span>
            <span>MASTERCARD</span>
            <span className="text-neutral-300">·</span>
            <span>TROY</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {settings.address?.trim() ? settings.address : "Türkiye"}
          </p>
        </div>
      </div>
    </footer>
  );
}
