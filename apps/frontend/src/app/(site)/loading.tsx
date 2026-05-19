export default function SiteLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:px-6 sm:py-12">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/90" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-slate-200/80" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="aspect-[4/3] animate-pulse bg-slate-200/70" />
            <div className="space-y-3 p-5">
              <div className="h-4 max-w-[85%] animate-pulse rounded bg-slate-200/80" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
