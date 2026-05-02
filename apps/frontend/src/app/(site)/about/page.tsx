import Link from "next/link";
import { apiJsonSafe } from "@/lib/api";

type CmsPage = { title: string; content: unknown };

export const metadata = { title: "Hakkımızda" };

const pillars = [
  {
    icon: "🎯",
    title: "Misyon",
    body: "Müşterilerimize kaliteli ürünler sunmak ve üstün bir alışveriş deneyimi yaşatmak.",
  },
  {
    icon: "🌱",
    title: "Vizyon",
    body: "Sektörümüzde öncü ve yenilikçi bir marka olarak müşteri memnuniyetini en üst seviyede tutmak.",
  },
  {
    icon: "🤝",
    title: "Değerler",
    body: "Şeffaflık, güvenilirlik ve sürekli iyileşme. Her kararı müşteri değeri üzerinden alıyoruz.",
  },
];

export default async function AboutPage() {
  const page = await apiJsonSafe<CmsPage>("/cms/pages/about");

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Kurumsal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {page?.title ?? "Hakkımızda"}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Küçük ve orta ölçekli işletmeler için modern e-ticaret ve kurumsal vitrin çözümü sunuyoruz.
          Amacımız, markanızı güçlü bir dijital hikâyeye dönüştürmek.
        </p>
      </div>

      <section
        id="biz-kimiz"
        className="scroll-mt-28 fade-up mt-14 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Biz kimiz</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Ekibimiz ve yaklaşımımız</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Deneyimli bir ekiple ürün, tasarım ve operasyonu bir arada düşünüyoruz. Şeffaf iletişim ve ölçülebilir
          teslimatlarla mağazanızın büyümesine odaklanıyoruz.
        </p>
      </section>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {pillars.map((p, i) => (
          <li
            key={p.title}
            className="card-soft fade-up p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-2xl" aria-hidden>
              {p.icon}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
          </li>
        ))}
      </ul>

      {page?.content ? (
        <article className="fade-up mt-14 card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Detaylar</h2>
          <pre className="mt-4 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
            {JSON.stringify(page.content, null, 2)}
          </pre>
        </article>
      ) : (
        <div
          className="fade-up mt-14 rounded-3xl p-8 text-white sm:p-12"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Bizimle çalışmak ister misiniz?
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            İletişim formumuz üzerinden bize ulaşın; size en kısa sürede dönelim.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-transform duration-300 ease-spring hover:-translate-y-0.5 hover:scale-[1.03]"
          >
            İletişime geç <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
