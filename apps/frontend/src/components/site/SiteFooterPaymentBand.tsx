import Image from "next/image";

/** iyzico + kart logoları — koyu footer arka planı için beyaz bant */
export function SiteFooterPaymentBand() {
  return (
    <section className="si-payment-band mt-10 border-t border-white/[0.08] pt-8 sm:pt-10" aria-labelledby="payment-band-title">
      <h2 id="payment-band-title" className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        Güvenli Ödeme Seçenekleri
      </h2>
      <div className="mx-auto mt-4 flex max-w-3xl justify-center px-2">
        <Image
          src="/images/logo_band_white.png"
          alt="iyzico ile öde, Mastercard, Visa, American Express, Troy"
          width={960}
          height={120}
          className="h-auto w-full max-w-full object-contain"
          sizes="(max-width: 640px) 100vw, 720px"
          loading="lazy"
        />
      </div>
      <p className="mx-auto mt-3 max-w-xl text-center text-xs leading-relaxed text-slate-500">
        Ödemeleriniz iyzico altyapısı ve güvenli kart sistemleri ile korunur.
      </p>
    </section>
  );
}
