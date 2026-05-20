import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

type Props = {
  products: ProductCardData[];
};

/** Öne çıkan vitrin — standart ProductCard, eşit yükseklik */
export function HomeEditorialProductGrid({ products }: Props) {
  const list = products.slice(0, 8);
  if (list.length === 0) return null;

  return (
    <ul className="grid auto-rows-fr grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
      {list.map((p) => (
        <li key={p.id} className="flex min-h-0">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
