import { ProductGridSkeleton } from "@/components/store/ProductGridSkeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="h-9 w-2/3 max-w-md animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-100" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
