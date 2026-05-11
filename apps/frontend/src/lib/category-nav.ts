/** Public GET /categories satırı (Prisma + _count) */
export type CategoryApiRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  _count?: { products: number };
};

export type HeaderNavChild = { id: string; name: string; slug: string };

export type HeaderNavCategory = {
  id: string;
  name: string;
  slug: string;
  children: HeaderNavChild[];
};

function sortCategories(a: CategoryApiRow, b: CategoryApiRow) {
  const o = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (o !== 0) return o;
  return a.name.localeCompare(b.name, "tr");
}

/** Kök kategoriler + doğrudan çocukları (tek seviye dropdown). */
export function buildHeaderCategoryNav(rows: CategoryApiRow[]): HeaderNavCategory[] {
  if (!rows.length) return [];

  const byParent = new Map<string | null, CategoryApiRow[]>();
  for (const r of rows) {
    const key = r.parentId ?? null;
    const list = byParent.get(key);
    if (list) list.push(r);
    else byParent.set(key, [r]);
  }

  let roots = (byParent.get(null) ?? []).slice().sort(sortCategories);

  if (!roots.length) {
    roots = rows.slice().sort(sortCategories);
    return roots.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      children: [],
    }));
  }

  return roots.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    children: (byParent.get(r.id) ?? []).slice().sort(sortCategories).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
  }));
}

export function shopCategoryHref(categoryId: string) {
  return `/shop?categoryId=${encodeURIComponent(categoryId)}`;
}

/** Mağazada kategori + sıralama/görünüm parametrelerini koruyarak link üretir. */
export function shopBrowseHref(args: {
  categoryId: string;
  sort?: string;
  view?: "grid" | "list";
}) {
  const p = new URLSearchParams();
  p.set("categoryId", args.categoryId);
  if (args.sort && args.sort !== "newest") p.set("sort", args.sort);
  if (args.view === "list") p.set("view", "list");
  const qs = p.toString();
  return `/shop?${qs}`;
}
