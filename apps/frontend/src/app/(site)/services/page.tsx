import Link from "next/link";
import { apiJsonSafe } from "@/lib/api";

type Service = { id: string; slug: string; title: string; summary: string | null; iconUrl?: string | null };

type CmsPage = { title: string; content: unknown };

function contentRecord(content: unknown): Record<string, unknown> | null {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  return null;
}

export const metadata = { title: "Hizmetler" };

export default async function ServicesPage() {
  const [listRaw, landing] = await Promise.all([
    apiJsonSafe<Service[]>("/cms/services"),
    apiJsonSafe<CmsPage>("/cms/pages/services-index"),
  ]);
  const services = listRaw ?? [];
  const c = contentRecord(landing?.content);
  const eyebrow =
    typeof c?.eyebrow === "string" && c.eyebrow.trim() ? c.eyebrow.trim() : "Ne sunuyoruz";
  const intro =
    typeof c?.intro === "string" && c.intro.trim()
      ? c.intro.trim()
      : "Her hizmet ayrı detay sayfasına yönlenir. İhtiyacınıza göre özel paket hazırlayabiliriz.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {landing?.title?.trim() || "Hizmetler"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{intro}</p>
      </div>
      <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 && (
          <li className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500 backdrop-blur">
            Henüz hizmet yok — yönetim panelinden CMS → Hizmet sayfası ile ekleyin.
          </li>
        )}
        {services.map((s, i) => (
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
