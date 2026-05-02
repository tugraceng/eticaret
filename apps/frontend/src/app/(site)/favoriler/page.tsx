"use client";

import Link from "next/link";
import { mergeLineIntoLocalCart } from "@/lib/cart-sync";
import { type WishItem } from "@/lib/wishlist";
import { useWishlistHydrated, useWishlistStore } from "@/stores/wishlist-store";

function priceFmt(cents: number) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

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
      // ignore
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="section-shell">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-rose-50/70 to-transparent" aria-hidden />
        <div className="relative">
          <Link href="/#urunler" className="link-underline text-sm text-slate-600 hover:text-slate-900">
            ← Alışverişe dön
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Favorilerim
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {hydrated
              ? items.length > 0
                ? `${items.length} ürün kaydedildi`
                : "Henüz favori ürününüz yok."
              : "Yükleniyor…"}
          </p>
        </div>
      </div>

      {hydrated ? (
        items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-3xl text-rose-500">
              ♥
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Beğendiğiniz ürünlerdeki kalp simgesine dokunarak favorilere ekleyebilirsiniz.
            </p>
            <Link href="/#urunler" className="btn-primary mt-6 inline-flex">
              Ürünleri keşfet →
            </Link>
          </div>
        ) : (
          <section className="surface-soft mt-10 divide-y divide-slate-100 p-2 sm:p-4">
            {items.map((it) => (
              <div key={it.productId} className="flex flex-wrap items-center gap-4 p-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-2xl">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt={it.title} className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>📦</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    prefetch={false}
                    href={`/shop/${it.slug}`}
                    className="block truncate text-sm font-semibold text-slate-900 hover:underline"
                  >
                    {it.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">{priceFmt(it.priceCents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(it)}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Sepete ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.productId)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:text-rose-600"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            ))}
          </section>
        )
      ) : (
        <div className="mt-10 flex justify-center py-16 text-sm text-slate-500">Yükleniyor…</div>
      )}
    </main>
  );
}
