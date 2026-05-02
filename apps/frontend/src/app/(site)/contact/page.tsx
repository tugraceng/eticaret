import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "İletişim" };

export default async function ContactPage() {
  const settings = await getSiteSettings();

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
          Soru, teklif veya işbirliği talebi için aşağıdaki formu kullanabilir ya da bize doğrudan
          ulaşabilirsiniz.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {settings.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="card-soft group flex items-start gap-4 p-5"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                }}
                aria-hidden
              >
                ✉
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  E-posta
                </p>
                <p className="mt-1 font-semibold text-slate-900 group-hover:text-sky-800">
                  {settings.contactEmail}
                </p>
              </div>
            </a>
          )}
          {settings.contactPhone && (
            <a
              href={`tel:${settings.contactPhone}`}
              className="card-soft group flex items-start gap-4 p-5"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                }}
                aria-hidden
              >
                ☎
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Telefon
                </p>
                <p className="mt-1 font-semibold text-slate-900 group-hover:text-sky-800">
                  {settings.contactPhone}
                </p>
              </div>
            </a>
          )}
          {settings.address && (
            <div className="card-soft flex items-start gap-4 p-5">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                }}
                aria-hidden
              >
                📍
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Adres
                </p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-slate-800">
                  {settings.address}
                </p>
              </div>
            </div>
          )}
        </div>

        <form className="card-soft space-y-4 p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="name">
              Ad Soyad
            </label>
            <input id="name" name="name" className="input-soft mt-2" placeholder="Örnek: Ayşe Yılmaz" />
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
              placeholder="siz@sirketiniz.com"
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
