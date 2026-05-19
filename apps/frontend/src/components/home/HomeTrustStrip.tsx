import { siteContainerClass } from "@/lib/design-system";
import { cn } from "@/lib/cn";

type TrustItem = { title: string; description: string };

const DEFAULT_ITEMS: TrustItem[] = [
  { title: "Ücretsiz kargo eşiği", description: "Belirtilen tutarın üzeri siparişlerde avantajlı gönderim." },
  { title: "Kolay iade", description: "Mesafeli satış ve tüketici mevzuatı kapsamında şeffaf süreç." },
  { title: "Güvenli ödeme", description: "SSL ve seçtiğiniz ödeme sağlayıcısı ile şifreli işlem." },
];

const TRUST_ICONS = [
  (
    <svg key="ship" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7V10z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
  (
    <svg key="return" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h12v10H4zM16 10h4v7h-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (
    <svg key="lock" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
    </svg>
  ),
];

function parseTrustItems(raw: unknown): TrustItem[] {
  if (!Array.isArray(raw)) return DEFAULT_ITEMS;
  const out: TrustItem[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const o = row as Record<string, unknown>;
    const title =
      typeof o.title === "string" ? o.title.trim() : typeof o.t === "string" ? o.t.trim() : "";
    const description =
      typeof o.description === "string"
        ? o.description.trim()
        : typeof o.d === "string"
          ? o.d.trim()
          : "";
    if (!title) continue;
    out.push({ title, description });
  }
  return out.length > 0 ? out : DEFAULT_ITEMS;
}

export function HomeTrustStrip({ items: itemsFromConfig }: { items?: unknown }) {
  const items = parseTrustItems(itemsFromConfig);
  return (
    <section className="border-y border-slate-200/90 bg-slate-50/60 section-y-tight" aria-label="Güven rozetleri">
      <div className={cn(siteContainerClass, "grid gap-6 sm:grid-cols-3 sm:gap-8")}>
        {items.map((x, i) => (
          <div
            key={`${x.title}-${i}`}
            className="fade-up flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80">
              {TRUST_ICONS[i % TRUST_ICONS.length]}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{x.title}</p>
              {x.description ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{x.description}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
