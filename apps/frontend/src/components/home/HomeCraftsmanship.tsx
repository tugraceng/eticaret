import { SiteFooterNewsletter } from "@/components/site/SiteFooterNewsletter";
import { apiAssetUrl } from "@/lib/api";

/** Ana sayfa hizmetler / üretim kalitesi bloğu — SiteSettings ile yönetilir. */
export function HomeCraftsmanship({
  kicker = "Üretim kalitesi",
  title = "Dijital zanaat",
  body = "FDM ve SLA süreçlerinde katman katman kontrol. Her parça gönderim öncesi atölyemizde ölçülür, yüzey işlenir ve koleksiyon standartlarına göre paketlenir.",
  imageUrl,
}: {
  kicker?: string;
  title?: string;
  body?: string;
  imageUrl?: string | null;
}) {
  const img = apiAssetUrl(imageUrl) ?? imageUrl?.trim() ?? null;
  return (
    <section className="si-section-alt" aria-labelledby="craftsmanship-heading">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className={img ? "order-2 lg:order-1" : undefined}>
          <p className="si-kicker">{kicker}</p>
          <h2 id="craftsmanship-heading" className="si-heading mt-2">
            {title}
          </h2>
          <p className="si-body mt-4 max-w-lg">{body}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Hassasiyet
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-sky-300/95">± 0.05 mm</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Malzeme
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">Endüstriyel sınıf filament</p>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col justify-center rounded-2xl border border-white/10 bg-[#141d2e] p-6 sm:p-8 ${img ? "order-1 lg:order-2" : ""}`}
        >
          {img ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                className="aspect-[4/3] h-auto w-full object-cover object-center"
              />
            </div>
          ) : null}
          <h3 className="si-heading text-xl sm:text-2xl">Koleksiyon bülteni</h3>
          <p className="si-body mt-3">
            Yeni parçalar ve sınırlı üretimler — doğrudan atölyeden haber alın.
          </p>
          <div className="mt-6">
            <SiteFooterNewsletter />
          </div>
        </div>
      </div>
    </section>
  );
}
