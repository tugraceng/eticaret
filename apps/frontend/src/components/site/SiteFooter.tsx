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

      <div className={cn(siteContainerClass, "py-8 sm:py-12 md:py-14")}>

        <div className="flex flex-col gap-6 border-b border-white/[0.08] pb-8 sm:gap-8 md:flex-row md:items-start md:justify-between md:gap-10 md:pb-12">

          <div className="max-w-md">

            <p className="si-kicker">{settings.newsletterKicker?.trim() || "Bülten"}</p>

            <h2 className="si-heading mt-2 text-xl sm:text-2xl">

              {settings.newsletterHeading?.trim() || "Koleksiyonlardan ilk siz haberdar olun"}

            </h2>

            <p className="si-body mt-2">

              {settings.newsletterSubtitle?.trim() ||

                "Yeni parçalar ve sınırlı üretimler — doğrudan atölyeden, spam yok."}

            </p>

          </div>

          <SiteFooterNewsletter settings={settings} />

        </div>

        <p className="mt-4 text-sm text-slate-500">

          {settings.newsletterDisclaimer?.trim() ||

            "Abone olarak gizlilik politikasını kabul etmiş olursunuz. İstediğiniz zaman ayrılabilirsiniz."}

        </p>



        <div className="mt-8 grid gap-8 sm:gap-10 md:mt-12 md:grid-cols-12 md:gap-12">

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



        <div className="si-footer-bottom-bar mt-8 grid grid-cols-1 items-center gap-4 border-t border-white/[0.08] pt-5 text-xs text-slate-500 sm:mt-10 sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:pt-6">
          <a
            href="https://tgrsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-[11px] font-medium tracking-wide text-slate-600 transition hover:text-slate-400 sm:block sm:justify-self-start"
          >
            tgrsoft
          </a>

          <p className="order-2 text-center sm:order-none">
            © {year} {settings.siteName} | Tüm hakları saklıdır.
          </p>

          <div className="order-1 flex justify-center sm:order-none sm:justify-end">
            <Image
              src="/images/logo_band_white.png"
              alt="iyzico ile öde, Mastercard, Visa, American Express, Troy"
              width={960}
              height={120}
              className="h-7 w-auto max-w-full object-contain sm:h-8 md:h-9"
              sizes="(max-width: 640px) 90vw, 420px"
              loading="lazy"
            />
          </div>

          <a
            href="https://tgrsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="order-3 text-center text-[11px] font-medium tracking-wide text-slate-600 transition hover:text-slate-400 sm:hidden"
          >
            tgrsoft
          </a>
        </div>

      </div>

    </footer>

  );

}

