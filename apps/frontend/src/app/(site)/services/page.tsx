import Link from "next/link";
import { apiJsonSafe } from "@/lib/api";

type Service = { id: string; slug: string; title: string; summary: string | null; iconUrl?: string | null };

export const metadata = { title: "Hizmetler" };

export default async function ServicesPage() {
  const list = (await apiJsonSafe<Service[]>("/cms/services")) ?? [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Ne sunuyoruz
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Hizmetler
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Her hizmet ayrı detay sayfasına yönlenir. İhtiyacınıza göre özel paket hazırlayabiliriz.
        </p>
      </div>
      <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 && (
          <li className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500 backdrop-blur">
            Henüz hizmet yok — yönetim panelinden CMS → Hizmetler ile ekleyin.
          </li>
        )}
        {list.map((s, i) => (
          <li key={s.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <Link href={`/services/${s.slug}`} className="card-soft group flex h-full flex-col p-6">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-inner"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                }}
                aria-hidden
              >
                {s.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.iconUrl} alt="" className="h-5 w-5" />
                ) : (
                  s.title.slice(0, 1).toUpperCase()
                )}
              </span>
              <p className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-sky-800">
                {s.title}
              </p>
              {s.summary && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.summary}</p>
              )}
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                Detay
                <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>
                  →
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
