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

      className="mt-auto border-t border-white/[0.08] bg-[#080c14] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-slate-200 md:pb-0"

    >

      <div className={cn(siteContainerClass, "py-12 sm:py-14")}>

        <div className="flex flex-col gap-8 border-b border-white/[0.08] pb-10 md:flex-row md:items-start md:justify-between md:gap-10 md:pb-12">

          <div className="max-w-md">

            <p className="si-kicker">Bülten</p>

            <h2 className="si-heading mt-2 text-xl sm:text-2xl">

              Koleksiyonlardan ilk siz haberdar olun

            </h2>

            <p className="si-body mt-2">

              Yeni parçalar ve sınırlı üretimler — doğrudan atölyeden, spam yok.

            </p>

          </div>

          <SiteFooterNewsletter />

        </div>

        <p className="mt-4 text-sm text-slate-500">

          Abone olarak gizlilik politikasını kabul etmiş olursunuz. İstediğiniz zaman ayrılabilirsiniz.

        </p>



        <div className="mt-12 grid gap-10 sm:gap-12 md:grid-cols-12">

          <div id="footer-brand" className="scroll-mt-28 md:col-span-5">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">

              <Link

                href="/"

                className="mt-4 inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white"

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

                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{settings.defaultMetaDesc}</p>

              ) : null}



              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">İletişim</p>

              {settings.contactEmail || settings.contactPhone || settings.address?.trim() ? (

                <div className="mt-2 space-y-2 text-sm text-slate-400">

                  {settings.contactEmail ? (

                    <p>

                      <a className="font-medium text-slate-200 hover:text-sky-300" href={`mailto:${settings.contactEmail}`}>

                        {settings.contactEmail}

                      </a>

                    </p>

                  ) : null}

                  {settings.contactPhone ? (

                    <p>

                      <a className="font-medium text-slate-200 hover:text-sky-300" href={`tel:${settings.contactPhone}`}>

                        {settings.contactPhone}

                      </a>

                    </p>

                  ) : null}

                  {settings.address?.trim() ? (

                    <p className="whitespace-pre-wrap leading-relaxed">{settings.address.trim()}</p>

                  ) : null}

                </div>

              ) : null}

              <p className="si-footer-tagline mt-6">Engineered for Precision</p>
              <p className="si-footer-motto">Crafted Layer by Layer</p>

              <Link

                href={contactHref}

                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-300 underline-offset-4 hover:text-white hover:underline"

              >

                {contactLabel}

                <span aria-hidden>→</span>

              </Link>



              {social.length > 0 ? (

                <>

                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sosyal</p>

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

                          className="si-social-btn"

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



          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 md:col-span-7">

            {Object.entries(columns).map(([title, items]) => (

              <div key={title}>

                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>

                <ul className="mt-4 space-y-2.5 text-sm">

                  {items.map((i) => (

                    <li key={i.href}>

                      <Link href={i.href} className="text-slate-400 transition hover:text-sky-300">

                        {i.label}

                      </Link>

                    </li>

                  ))}

                </ul>

              </div>

            ))}

          </div>

        </div>



        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.08] pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <p>

            © {year} {settings.siteName}. Tüm hakları saklıdır.

          </p>

          <div className="flex flex-wrap items-center gap-2 sm:justify-center">

            <span className="text-slate-600">İyzico</span>

            <span className="text-slate-700">·</span>

            <span>VISA</span>

            <span className="text-slate-700">·</span>

            <span>MASTERCARD</span>

            <span className="text-slate-700">·</span>

            <span>TROY</span>

          </div>

          <a

            href="https://tgrsoft.com"

            target="_blank"

            rel="noopener noreferrer"

            className="text-[11px] font-medium tracking-wide text-slate-600 transition hover:text-slate-400 max-sm:self-end sm:text-right"

          >

            tgrsoft

          </a>

        </div>

      </div>

    </footer>

  );

}

