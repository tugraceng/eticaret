/** Mağaza grid iskeleti — CLS düşük, mobil öncelikli. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-slate-100 to-slate-50" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-[80%] max-w-[12rem] animate-pulse rounded bg-slate-200/90" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="flex justify-between pt-2">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200/80" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
