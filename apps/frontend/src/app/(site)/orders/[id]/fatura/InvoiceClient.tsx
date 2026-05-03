"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";
import { PrintButton } from "./PrintButton";

type Settings = {
  siteName: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  taxRateBp?: number;
  taxIncluded?: boolean;
};

type Order = {
  id: string;
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  taxCents?: number;
  discountCents?: number;
  discountCode?: string | null;
  currency: string;
  createdAt: string;
  guestEmail?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  identityNumber?: string | null;
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingDistrict?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  items: { quantity: number; titleSnapshot: string; unitPriceCents: number }[];
};

function fmt(cents: number, currency: string) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency });
}

async function readError(res: Response) {
  return formatApiErrorPayload(await res.text(), res.status);
}

export function InvoiceClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<"loading" | "login" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    const token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY)?.trim();
    if (!token) throw new Error("Faturayı görüntülemek için müşteri hesabınızla giriş yapın.");
    const res = await fetch(apiUrl(`/orders/${orderId}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await readError(res));
    return (await res.json()) as Order;
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [o, s] = await Promise.all([
          loadOrder(),
          fetch(apiUrl("/settings")).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (!cancelled) {
          setOrder(o);
          setSettings(s);
          setPhase("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setPhase("login");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const subtotal = useMemo(
    () => order?.subtotalCents ?? order?.items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0) ?? 0,
    [order],
  );
  const taxBp = settings?.taxRateBp ?? 0;
  const taxIncluded = settings?.taxIncluded ?? true;

  if (phase === "loading") {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-600 sm:px-6">Fatura doğrulanıyor...</main>;
  }

  if (phase === "login" || !order) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="section-shell space-y-4 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Faturayı görüntülemek için giriş yapın</h1>
          <p className="text-sm text-slate-600">
            Fatura ön izlemesi yalnızca siparişi veren müşteri hesabında görüntülenebilir.
          </p>
          {error && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          <Link href="/hesap/giris" className="btn-primary">
            Giriş yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0 sm:px-6">
      <style>{`@media print {.no-print{display:none!important}body{background:#fff}}`}</style>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/orders/${order.id}`} className="text-sm text-slate-600 hover:text-slate-900">
          Siparişe dön
        </Link>
        <PrintButton />
      </div>

      <article className="surface-soft rounded-2xl p-8 text-slate-900 print:border-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt={settings.siteName} className="mb-3 h-10 w-auto" />
            ) : null}
            <h1 className="text-2xl font-semibold">{settings?.siteName ?? "Mağaza"}</h1>
            {settings?.address ? <p className="mt-1 whitespace-pre-line text-xs text-slate-600">{settings.address}</p> : null}
            {settings?.contactEmail ? <p className="text-xs text-slate-600">{settings.contactEmail}</p> : null}
            {settings?.contactPhone ? <p className="text-xs text-slate-600">{settings.contactPhone}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Fatura</p>
            <p className="mt-1 font-mono text-sm">#{order.id.slice(0, 12).toUpperCase()}</p>
            <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("tr-TR")}</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Alıcı</h2>
            <p className="mt-1 font-medium">{order.contactName ?? "-"}</p>
            {order.guestEmail ? <p className="text-xs text-slate-600">{order.guestEmail}</p> : null}
            {order.contactPhone ? <p className="text-xs text-slate-600">{order.contactPhone}</p> : null}
            {order.identityNumber ? <p className="text-xs text-slate-600">T.C.: {order.identityNumber}</p> : null}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Teslimat adresi</h2>
            <p className="mt-1 whitespace-pre-line text-xs text-slate-700">
              {[order.shippingLine1, order.shippingLine2, [order.shippingDistrict, order.shippingCity, order.shippingPostalCode].filter(Boolean).join(" / "), order.shippingCountry ?? undefined].filter(Boolean).join("\n") || "-"}
            </p>
          </div>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2">Ürün</th><th className="py-2 text-right">Adet</th><th className="py-2 text-right">Birim</th><th className="py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((it, i) => (
              <tr key={i}>
                <td className="py-2">{it.titleSnapshot}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{fmt(it.unitPriceCents, order.currency)}</td>
                <td className="py-2 text-right">{fmt(it.unitPriceCents * it.quantity, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-72 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600"><dt>Ara toplam</dt><dd>{fmt(subtotal, order.currency)}</dd></div>
            {!!order.discountCents && <div className="flex justify-between text-emerald-700"><dt>İndirim{order.discountCode ? ` (${order.discountCode})` : ""}</dt><dd>- {fmt(order.discountCents, order.currency)}</dd></div>}
            {typeof order.shippingCents === "number" && <div className="flex justify-between text-slate-600"><dt>Kargo</dt><dd>{order.shippingCents > 0 ? fmt(order.shippingCents, order.currency) : "Ücretsiz"}</dd></div>}
            {!!order.taxCents && <div className="flex justify-between text-slate-600"><dt>KDV{taxBp > 0 ? ` (%${(taxBp / 100).toFixed(0)})` : ""}{taxIncluded ? <span className="text-[10px]"> dahil</span> : null}</dt><dd>{fmt(order.taxCents, order.currency)}</dd></div>}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><dt>Genel Toplam</dt><dd>{fmt(order.totalCents, order.currency)}</dd></div>
          </dl>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          Bu bir e-arşiv fatura ön izlemesidir. Resmi vergi belgesi niteliğinde değildir.
        </footer>
      </article>
    </div>
  );
}
