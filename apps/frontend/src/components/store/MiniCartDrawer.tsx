"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { apiUrl } from "@/lib/api";
import type { ProductCardData } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/atoms";
import { useSiteSettingsQuery } from "@/hooks/useSiteSettingsQuery";
import { selectCartSubtotalCents, useCartStore } from "@/stores/cart-store";
import { FreeShippingBar } from "./FreeShippingBar";

export function MiniCartDrawer() {
  const open = useCartStore((s) => s.miniCartOpen);
  const close = useCartStore((s) => s.closeMiniCart);
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectCartSubtotalCents);
  const setQty = useCartStore((s) => s.setLineQuantity);
  const remove = useCartStore((s) => s.removeLine);
  const addLine = useCartStore((s) => s.addLine);

  const { data: settings } = useSiteSettingsQuery({ enabled: open });
  const threshold = settings?.freeShippingThresholdCents ?? 0;

  const cartIds = new Set(lines.map((l) => l.productId));

  const { data: recs = [] } = useQuery({
    queryKey: ["mini-cart-recs"],
    queryFn: async (): Promise<ProductCardData[]> => {
      const r = await fetch(apiUrl("/products/catalog?sort=popular&limit=8&page=1"));
      if (!r.ok) return [];
      const j = (await r.json()) as { items: ProductCardData[] };
      return j.items ?? [];
    },
    enabled: open,
    staleTime: 120_000,
  });

  const filteredRecs = recs.filter((p) => !cartIds.has(p.id)).slice(0, 4);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const fmt = (c: number | undefined) =>
    typeof c === "number"
      ? (c / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
      : "—";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[85] bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Sepet panelini kapat"
            onClick={close}
          />
          <motion.aside
            id="mini-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mini-cart-title"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="fixed bottom-0 right-0 top-0 z-[86] flex w-full max-w-[min(100vw-0px,420px)] flex-col border-l border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-lift"
          >
            <header className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-4">
              <h2 id="mini-cart-title" className="text-h3 text-[var(--ds-text)]">
                Sepetiniz
              </h2>
              <Button type="button" variant="ghost" size="icon" aria-label="Kapat" onClick={close}>
                ×
              </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {threshold > 0 ? (
                <FreeShippingBar subtotalCents={subtotal} freeShippingThresholdCents={threshold} className="mb-6" />
              ) : null}

              {lines.length === 0 ? (
                <p className="rounded-ds-lg border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface-muted)] p-8 text-center text-small text-[var(--ds-text-muted)]">
                  Sepetiniz boş. Keşfetmeye devam edin.
                </p>
              ) : (
                <ul className="space-y-4">
                  {lines.map((l) => (
                    <li
                      key={l.lineKey}
                      className="flex gap-3 rounded-ds-lg border border-[var(--ds-border)] p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--ds-surface-muted)]">
                        {l.imageUrl ? (
                          <Image
                            src={l.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        {l.slug ? (
                          <Link
                            href={`/shop/${l.slug}`}
                            className="line-clamp-2 text-small font-semibold text-[var(--ds-text)] hover:underline"
                            onClick={close}
                          >
                            {l.title}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-small font-semibold">{l.title}</p>
                        )}
                        <p className="mt-1 text-micro text-[var(--ds-text-muted)]">{fmt(l.priceCents)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center rounded-full border border-[var(--ds-border)]">
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center text-[var(--ds-text)] hover:bg-[var(--ds-surface-muted)]"
                              aria-label="Adet azalt"
                              onClick={() => setQty(l.lineKey, l.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-small font-semibold">{l.quantity}</span>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center text-[var(--ds-text)] hover:bg-[var(--ds-surface-muted)]"
                              aria-label="Adet artır"
                              onClick={() => setQty(l.lineKey, l.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-micro font-semibold text-[var(--ds-color-error)] hover:underline"
                            onClick={() => remove(l.lineKey)}
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {filteredRecs.length > 0 ? (
                <section className="mt-8 border-t border-[var(--ds-border)] pt-6" aria-label="Önerilen ürünler">
                  <p className="text-micro uppercase text-[var(--ds-text-muted)]">Bunları da beğendiniz</p>
                  <ul className="mt-3 space-y-3">
                    {filteredRecs.map((p) => {
                      const img = p.images?.[0]?.url;
                      return (
                        <li key={p.id} className="flex items-center gap-3">
                          <Link
                            href={`/shop/${p.slug}`}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--ds-surface-muted)]"
                            onClick={close}
                          >
                            {img ? (
                              <Image
                                src={img}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="56px"
                                unoptimized
                              />
                            ) : null}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/shop/${p.slug}`}
                              className="line-clamp-1 text-small font-medium text-[var(--ds-text)] hover:underline"
                              onClick={close}
                            >
                              {p.name}
                            </Link>
                            <p className="text-micro text-[var(--ds-text-muted)]">{fmt(p.priceCents)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="min-h-9 shrink-0 px-3 text-[10px]"
                            onClick={() =>
                              addLine({
                                productId: p.id,
                                quantity: 1,
                                title: p.name,
                                priceCents: p.priceCents,
                                slug: p.slug,
                                imageUrl: img,
                              })
                            }
                          >
                            Ekle
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </div>

            <footer className="border-t border-[var(--ds-border)] bg-[var(--ds-surface-muted)]/80 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-body">
                <span className="text-[var(--ds-text-muted)]">Ara toplam</span>
                <span className="font-semibold text-[var(--ds-text)]">{fmt(subtotal)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/cart"
                  className="btn-ghost min-h-12 flex-1 justify-center text-center text-small font-semibold"
                  onClick={close}
                >
                  Sepeti gör
                </Link>
                <Link
                  href="/checkout"
                  className="btn-primary min-h-12 flex-1 justify-center text-center text-small font-semibold"
                  onClick={close}
                >
                  Ödemeye geç
                </Link>
              </div>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
