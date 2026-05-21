"use client";

import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";
import { ProductCard } from "@/components/site/ProductCard";
import { mergeLineIntoLocalCart } from "@/lib/cart-sync";
import { type WishItem } from "@/lib/wishlist";
import { useWishlistHydrated, useWishlistStore } from "@/stores/wishlist-store";

export default function WishlistPage() {
  const hydrated = useWishlistHydrated();
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);

  const addToCart = (item: WishItem) => {
    try {
      mergeLineIntoLocalCart({
        productId: item.productId,
        quantity: 1,
        title: item.title,
        priceCents: item.priceCents,
        slug: item.slug,
        imageUrl: item.imageUrl,
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <PageContainer as="main" className="py-10 sm:py-12">
      <PageHeader
        eyebrow="Kayıtlı ürünler"
        title="Favorilerim"
        description={
          hydrated
            ? items.length > 0
              ? `${items.length} ürün kaydedildi`
              : "Henüz favori ürününüz yok."
            : "Yükleniyor…"
        }
      />

      {hydrated ? (
        items.length === 0 ? (
          <div className="si-empty-state mt-10">
            <p>Beğendiğiniz ürünlerdeki kalp simgesine dokunarak favorilere ekleyebilirsiniz.</p>
            <Link href="/shop" className="btn-primary mt-6 inline-flex">
              Ürünleri keşfet →
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid auto-rows-fr grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
            {items.map((it) => (
              <li key={it.productId} className="relative flex min-h-0">
                <ProductCard
                  product={{
                    id: it.productId,
                    slug: it.slug,
                    name: it.title,
                    priceCents: it.priceCents,
                    images: it.imageUrl ? [{ url: it.imageUrl, alt: it.title }] : [],
                  }}
                  showDescription
                />
                <div className="pointer-events-auto absolute right-2 top-2 z-[8] flex gap-1">
                  <button
                    type="button"
                    onClick={() => addToCart(it)}
                    className="si-fav-quick-cart rounded-lg px-2 py-1 text-[10px] font-semibold"
                  >
                    Sepete
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.productId)}
                    className="rounded-lg border border-white/15 bg-black/50 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:text-rose-300"
                    aria-label="Favoriden kaldır"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-10 py-16 text-center text-sm text-slate-500">Yükleniyor…</div>
      )}
    </PageContainer>
  );
}
