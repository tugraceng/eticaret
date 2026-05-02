export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="h-9 w-2/3 max-w-md animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-100" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="aspect-[4/3] animate-pulse bg-slate-100" />
            <div className="space-y-3 p-4">
              <div className="h-4 max-w-[85%] animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-50" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
