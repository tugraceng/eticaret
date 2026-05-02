"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { apiUrl } from "@/lib/api";
import { readLocalCartFromStorage, syncCartFromStorage } from "@/lib/cart-sync";
import { CART_UPDATE_EVENT } from "@/lib/platform-storage-events";
import { showSiteToast } from "@/lib/site-toast";
import { useCartStore } from "@/stores/cart-store";

type Settings = {
  shippingFeeCents: number;
  freeShippingThresholdCents: number;
};

function priceFmt(cents: number | undefined) {
  if (typeof cents !== "number") return "";
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function CartIconLarge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

export default function CartPage() {
  const lines = useCartStore((s) => s.lines);
  const hydrate = useCartStore((s) => s.hydrate);
  const replaceLines = useCartStore((s) => s.replaceLines);
  const setLineQuantity = useCartStore((s) => s.setLineQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [mounted, setMounted] = useState(false);
  const [removeLineKey, setRemoveLineKey] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setMounted(true);
    void (async () => {
      const merged = await syncCartFromStorage();
      if (merged) replaceLines(merged);
    })();
    const refresh = () => hydrate();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "platform_cart") refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_UPDATE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_UPDATE_EVENT, refresh);
    };
  }, [hydrate, replaceLines]);

  useEffect(() => {
    return () => {
      try {
        const still = readLocalCartFromStorage();
        if (still.length > 0) {
          sessionStorage.setItem("platform_cart_abandon_hint", "1");
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(apiUrl("/settings"));
        if (!res.ok) return;
        const s = (await res.json()) as Settings;
        setSettings({
          shippingFeeCents: s.shippingFeeCents ?? 0,
          freeShippingThresholdCents: s.freeShippingThresholdCents ?? 0,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  const setQty = (lineKey: string, qty: number) => {
    setLineQuantity(lineKey, qty);
  };

  const removeProductLine = (lineKey: string) => {
    removeLine(lineKey);
    setRemoveLineKey(null);
    showSiteToast({ message: "Ürün sepetten kaldırıldı.", kind: "info" });
  };

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (l.priceCents ?? 0) * l.quantity, 0),
    [lines],
  );

  const shipping = useMemo(() => {
    if (!settings) return null;
    if (settings.shippingFeeCents <= 0) return 0;
    if (
      settings.freeShippingThresholdCents > 0 &&
      subtotal >= settings.freeShippingThresholdCents
    )
      return 0;
    return settings.shippingFeeCents;
  }, [settings, subtotal]);

  const total = subtotal + (shipping ?? 0);
  const remainingForFreeShip =
    settings && settings.freeShippingThresholdCents > 0
      ? Math.max(0, settings.freeShippingThresholdCents - subtotal)
      : 0;

  return (
    <main className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-12 md:py-14">
      <div className="section-shell">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-50/70 to-transparent" aria-hidden />
        <div className="relative">
        <Link
          href="/#urunler"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden className="text-base">
            ←
          </span>
          Alışverişe dön
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-4 sm:text-3xl md:text-4xl">
          Sepetim
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {mounted
            ? totalQty > 0
              ? `${totalQty} adet · ${lines.length} ürün çeşidi`
              : "Sepetiniz boş."
            : "Yükleniyor…"}
        </p>
        </div>
      </div>

      {mounted && lines.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-14 text-center shadow-sm sm:mt-10 sm:py-16">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/80">
            <CartIconLarge className="h-10 w-10" />
          </div>
          <p className="mt-5 text-base font-medium text-slate-800">Sepetiniz henüz boş</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            Beğendiğiniz ürünleri sepete ekleyerek güvenle alışverişe devam edebilirsiniz.
          </p>
          <Link
            href="/#urunler"
            className="btn-primary mt-8 inline-flex min-h-[2.75rem] items-center justify-center px-8"
          >
            Alışverişe başla
            <span aria-hidden className="ml-1">
              →
            </span>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1fr_min(100%,390px)] lg:items-start lg:gap-8">
          <section className="flex flex-col gap-4">
            {lines.map((l) => (
              <article
                key={l.lineKey}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_14px_35px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/[0.03] sm:rounded-3xl"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                  <div className="flex gap-4 sm:min-w-0 sm:flex-1">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 sm:h-28 sm:w-28">
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt={l.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-2xl text-slate-400" aria-hidden>
                          📦
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      {l.slug ? (
                        <Link
                          href={`/shop/${l.slug}`}
                          className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 hover:underline sm:text-[15px]"
                        >
                          {l.title}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 sm:text-[15px]">
                          {l.title}
                        </p>
                      )}
                      {typeof l.priceCents === "number" && (
                        <p className="mt-1 text-xs text-slate-500">{priceFmt(l.priceCents)} / adet</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemoveLineKey(l.lineKey)}
                        className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 p-0.5 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setQty(l.lineKey, l.quantity - 1)}
                        className="grid h-10 w-10 place-items-center rounded-full text-lg text-slate-700 transition hover:bg-white hover:shadow-sm"
                        aria-label="Azalt"
                      >
                        −
                      </button>
                      <span className="min-w-[2.25rem] text-center text-sm font-bold tabular-nums text-slate-900">
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(l.lineKey, l.quantity + 1)}
                        className="grid h-10 w-10 place-items-center rounded-full text-lg text-slate-700 transition hover:bg-white hover:shadow-sm"
                        aria-label="Arttır"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-right text-lg font-semibold tabular-nums text-slate-900 sm:text-base">
                      {priceFmt((l.priceCents ?? 0) * l.quantity)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="surface-soft p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Sipariş özeti</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-slate-600">
                  <dt>Ara toplam</dt>
                  <dd className="font-medium tabular-nums text-slate-800">{priceFmt(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-slate-600">
                  <dt>Kargo</dt>
                  <dd className="font-medium tabular-nums text-slate-800">
                    {shipping === null ? "—" : shipping === 0 ? "Ücretsiz" : priceFmt(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
                  <dt>Toplam</dt>
                  <dd className="tabular-nums">{priceFmt(total)}</dd>
                </div>
              </dl>

              {remainingForFreeShip > 0 && settings && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/90 p-4 text-xs text-emerald-900">
                  <p className="font-semibold leading-snug">
                    Ücretsiz kargoya <span className="tabular-nums">{priceFmt(remainingForFreeShip)}</span> kaldı
                  </p>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-emerald-200/70">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (subtotal / settings.freeShippingThresholdCents) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <Link
                href="/checkout"
                className="btn-primary mt-6 flex min-h-[2.875rem] w-full items-center justify-center text-[15px]"
              >
                Ödeme adımına geç
                <span aria-hidden className="ml-1">
                  →
                </span>
              </Link>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
                İndirim kodu, teslimat adresi ve ödeme bir sonraki adımda.
              </p>
            </div>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={removeLineKey !== null}
        title="Ürünü sepetten çıkar"
        description="Bu ürün sepetinizden kaldırılacak."
        confirmLabel="Kaldır"
        cancelLabel="Vazgeç"
        variant="danger"
        onCancel={() => setRemoveLineKey(null)}
        onConfirm={() => {
          if (removeLineKey) removeProductLine(removeLineKey);
        }}
      />
    </main>
  );
}
