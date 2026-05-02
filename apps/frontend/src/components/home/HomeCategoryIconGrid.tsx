import Link from "next/link";
import type { ShopCategory } from "@/app/(site)/shop/CategoryStrip";

const GLYPHS = ["◆", "◇", "✦", "◎", "◉", "▣", "▲", "▼"];

export function HomeCategoryIconGrid({
  categories,
  kicker = "Kategoriler",
  heading = "Hızlı keşif",
  description = "İlgilendiğiniz alana tek dokunuşla gidin.",
}: {
  categories: ShopCategory[];
  kicker?: string | null;
  heading?: string | null;
  description?: string | null;
}) {
  const show = categories.slice(0, 8);
  if (!show.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1 text-center sm:text-left">
        {kicker ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{kicker}</p>
        ) : null}
        {heading ? (
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{heading}</h2>
        ) : null}
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {show.map((c, i) => (
          <li key={c.id}>
            <Link
              href={`/shop?categoryId=${encodeURIComponent(c.id)}`}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-lg text-slate-700 transition group-hover:from-sky-50 group-hover:to-indigo-50 group-hover:text-sky-900"
                aria-hidden
              >
                {GLYPHS[i % GLYPHS.length]}
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
