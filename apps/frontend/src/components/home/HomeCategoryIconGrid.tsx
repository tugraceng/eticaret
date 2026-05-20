import Link from "next/link";
import type { ShopCategory } from "@/app/(site)/shop/CategoryStrip";

function CategoryLineIcon({ index }: { index: number }) {
  const paths = [
    "M8 12h8M12 8v8M6 6l12 12",
    "M7 10h10v6H7zM9 8V6h6v2",
    "M6 14l4-8 4 8M8 14h4",
    "M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z",
    "M8 8h8v8H8z",
    "M6 12h12M12 6v12",
    "M8 16l4-10 4 10",
    "M10 6h4v12h-4z",
  ];
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d={paths[index % paths.length]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeCategoryIconGrid({
  categories,
  kicker = "Koleksiyonlar",
  heading = "Kategoriye göre keşfet",
  description = "Hassas baskı parçalar — tek dokunuşla vitrine gidin.",
}: {
  categories: ShopCategory[];
  kicker?: string | null;
  heading?: string | null;
  description?: string | null;
}) {
  const show = categories.slice(0, 8);
  if (!show.length) return null;

  return (
    <section className="si-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:max-w-lg">
          {kicker ? <p className="si-kicker">{kicker}</p> : null}
          {heading ? <h2 className="si-heading mt-2">{heading}</h2> : null}
          {description ? <p className="si-body mt-2">{description}</p> : null}
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
          {show.map((c, i) => (
            <li key={c.id}>
              <Link href={`/shop?categoryId=${encodeURIComponent(c.id)}`} className="si-category-card group">
                <span className="si-category-icon">
                  <CategoryLineIcon index={i} />
                </span>
                <span className="si-category-label line-clamp-2">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
