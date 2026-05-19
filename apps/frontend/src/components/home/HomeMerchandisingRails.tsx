import { HomeProductRail } from "./HomeProductRail";
import type { ProductCardData } from "@/components/site/ProductCard";

type Props = {
  bestsellers: ProductCardData[];
  popular: ProductCardData[];
  newest: ProductCardData[];
};

export function HomeMerchandisingRails({ bestsellers, popular, newest }: Props) {
  const hasAny = bestsellers.length + popular.length + newest.length > 0;
  if (!hasAny) return null;

  return (
    <section className="bg-white pb-4 pt-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Mağaza</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Ürün şeritleri</h2>
        </div>
        {bestsellers.length > 0 ? (
          <HomeProductRail title="En çok satanlar" href="/shop" products={bestsellers} />
        ) : null}
        {popular.length > 0 ? (
          <HomeProductRail title="Trend / popüler" href="/shop" products={popular} />
        ) : null}
        {newest.length > 0 ? (
          <HomeProductRail title="Yeni gelenler" href="/shop" products={newest} />
        ) : null}
      </div>
    </section>
  );
}
