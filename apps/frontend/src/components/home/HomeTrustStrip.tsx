type TrustItem = { title: string; description: string };

const DEFAULT_ITEMS: TrustItem[] = [
  { title: "Ücretsiz kargo eşiği", description: "Belirtilen tutarın üzeri siparişlerde avantajlı gönderim." },
  { title: "Kolay iade", description: "Mesafeli satış ve tüketici mevzuatı kapsamında şeffaf süreç." },
  { title: "Güvenli ödeme", description: "SSL ve seçtiğiniz ödeme sağlayıcısı ile şifreli işlem." },
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
    <section className="border-y border-slate-200/80 bg-white py-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
        {items.map((x, i) => (
          <div
            key={`${x.title}-${i}`}
            className="fade-up text-center sm:text-left"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-sm font-semibold text-slate-900">{x.title}</p>
            {x.description ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{x.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
