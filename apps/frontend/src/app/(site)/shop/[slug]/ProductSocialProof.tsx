"use client";

function hashToInt(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

/** Kampanya amaçlı tutarlı ziyaret tahmini (gerçek raporlama değildir). */
export function ProductSocialProof({ slug }: { slug: string }) {
  const n = 12 + (hashToInt(slug) % 75);
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-[11px] leading-snug text-amber-950/90">
      <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
      <span>
        Son 24 saatte bu ürüne yaklaşık <strong className="font-semibold">{n}</strong> ziyaret oldu.{" "}
        <span className="text-amber-900/70">(Gösterim tahmini; kampanya amaçlıdır.)</span>
      </span>
    </p>
  );
}
