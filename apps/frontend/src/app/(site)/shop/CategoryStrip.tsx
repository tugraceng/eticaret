import Link from "next/link";

export type ShopCategory = { id: string; name: string; slug: string };

function shopSearch(parts: { q?: string; categoryId?: string }) {
  const p = new URLSearchParams();
  if (parts.q) p.set("q", parts.q);
  if (parts.categoryId) p.set("categoryId", parts.categoryId);
  const qs = p.toString();
  return qs ? `?${qs}#urunler` : "#urunler";
}

export function CategoryStrip({
  categories,
  activeCategoryId,
  activeQ,
}: {
  categories: ShopCategory[];
  activeCategoryId?: string;
  activeQ?: string;
}) {
  const allHref = `/${shopSearch({ q: activeQ })}`;
  return (
    <div className="-mx-1 max-md:overflow-x-auto max-md:pb-1 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden md:mx-0">
      <div className="flex min-h-[2.75rem] snap-x snap-mandatory gap-2 max-md:flex-nowrap max-md:px-1 md:flex-wrap md:snap-none">
        <Link
          href={allHref}
          prefetch
          scroll={false}
          className="chip max-md:snap-start shrink-0"
          data-active={!activeCategoryId || undefined}
        >
          Tümü
        </Link>
        {categories.map((c) => {
          const href = `/${shopSearch({ categoryId: c.id, q: activeQ })}`;
          const on = activeCategoryId === c.id;
          return (
            <Link
              key={c.id}
              href={href}
              prefetch
              scroll={false}
              className="chip max-md:snap-start shrink-0"
              data-active={on || undefined}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
