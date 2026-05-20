import { siteContainerClass } from "@/lib/design-system";
import { cn } from "@/lib/cn";

type TrustItem = { title: string; description: string };

const DEFAULT_ITEMS: TrustItem[] = [
  { title: "Güvenli ödeme", description: "SSL ve seçtiğiniz ödeme sağlayıcısı ile şifreli işlem." },
  { title: "Kalite kontrol", description: "Her parça gönderim öncesi atölyemizde kontrol edilir." },
  { title: "Hızlı kargo", description: "Stoktan özenli paketleme ve takip edilebilir gönderim." },
  { title: "Yerel üretim", description: "Tasarım ve baskı tek atölyede — StoneIron3D." },
];

const TRUST_ICONS = [
  (
    <svg key="lock" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg key="qc" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3v4M5 7l2 2M19 7l-2 2" strokeLinecap="round" />
      <circle cx="12" cy="14" r="7" />
    </svg>
  ),
  (
    <svg key="ship" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7V10z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
  (
    <svg key="local" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" strokeLinejoin="round" />
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
    <section className="si-trust-strip" aria-label="Güven ve kalite">
      <div className={cn(siteContainerClass, "grid gap-8 sm:grid-cols-2 lg:grid-cols-4")}>
        {items.map((x, i) => (
          <div
            key={`${x.title}-${i}`}
            className="fade-up flex flex-col items-center gap-3 text-center sm:items-start sm:text-left"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="si-trust-icon">{TRUST_ICONS[i % TRUST_ICONS.length]}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">{x.title}</p>
              {x.description ? (
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{x.description}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
