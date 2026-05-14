import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "İletişim" };

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const contactHref = settings.contactNavHref?.trim() || "/contact";
  const contactLabel = settings.contactNavLabel?.trim() || "Bize ulaşın";

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Bize ulaşın
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          İletişim
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
          Soru, teklif veya işbirliği talebi için aşağıdaki formu kullanabilirsiniz. E-posta, telefon, adres ve
          sosyal medya bağlantıları sayfanın altındaki footer bölümünde yer alır.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="card-soft space-y-4 p-6">
            <p className="text-sm leading-relaxed text-slate-600">
              Güncel iletişim bilgileri ve sosyal hesaplar vitrinin altındaki footer’da, logo ve marka alanının
              yanında toplanmıştır.
            </p>
            <a
              href="#footer-brand"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline"
            >
              Footer’daki iletişim ve sosyal bağlantılara git
              <span aria-hidden>↓</span>
            </a>
            <p className="text-xs text-slate-500">
              Ayrıca menüden{" "}
              <a href={contactHref} className="font-medium text-slate-800 hover:underline">
                {contactLabel}
              </a>{" "}
              sayfasına gidebilirsiniz.
            </p>
          </div>
        </div>

        <form className="card-soft space-y-4 p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="name">
              Ad Soyad
            </label>
            <input id="name" name="name" className="input-soft mt-2" placeholder="Adınız ve soyadınız" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input-soft mt-2"
              placeholder="E-posta adresiniz"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="message">
              Mesaj
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="input-soft mt-2 resize-y"
              placeholder="Mesajınız…"
            />
          </div>
          <button type="button" className="btn-primary w-full sm:w-auto">
            Gönder
            <span aria-hidden>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
