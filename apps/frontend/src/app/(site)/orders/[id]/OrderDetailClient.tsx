"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";
import { CancelButton } from "./CancelButton";
import { ReturnRequestForm } from "./ReturnRequestForm";

type Order = {
  id: string;
  status: string;
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  taxCents?: number;
  discountCents?: number;
  discountCode?: string | null;
  currency: string;
  trackingNumber: string | null;
  createdAt: string;
  contactName?: string | null;
  contactPhone?: string | null;
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingDistrict?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  notes?: string | null;
  items: { id: string; quantity: number; titleSnapshot: string; unitPriceCents: number }[];
  returns?: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    createdAt: string;
    reason: string;
    items: { orderItemId: string; quantity: number }[];
  }[];
};

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const steps = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

function priceFmt(cents: number, currency: string) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency });
}

async function readError(res: Response) {
  return formatApiErrorPayload(await res.text(), res.status);
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<"loading" | "login" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);

  const fetchWithToken = async (token: string) => {
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
      const token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY)?.trim();
      if (!token) {
        setPhase("login");
        return;
      }
      try {
        const data = await fetchWithToken(token);
        if (!cancelled) {
          setOrder(data);
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

  const currentStep = order?.status === "CANCELLED" ? -1 : steps.indexOf(order?.status as (typeof steps)[number]);
  const subtotal = useMemo(
    () => order?.subtotalCents ?? order?.items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0) ?? 0,
    [order],
  );

  if (phase === "loading") {
    return <main className="mx-auto max-w-4xl px-4 py-12 text-sm text-slate-600 sm:px-6">Sipariş doğrulanıyor...</main>;
  }

  if (phase === "login" || !order) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="section-shell p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sipariş takibi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Hesabınıza giriş yapın</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sipariş detayları yalnızca siparişi veren müşteri hesabında görüntülenebilir.
          </p>
          {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/hesap/giris" className="btn-primary">
              Giriş yap
            </Link>
            <Link href="/hesap" className="btn-ghost">
              Hesabım
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/" className="link-underline text-sm text-slate-600 hover:text-slate-900">Alışverişe dön</Link>

      <div className="fade-up section-shell mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sipariş takibi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Siparişiniz hazırlanıyor
          </h1>
          <p className="mt-2 font-mono text-xs text-slate-500">#{order.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusClass[order.status] ?? "bg-slate-100 text-slate-700"}`}>
          {order.status}
        </span>
      </div>

      {currentStep >= 0 && (
        <ol className="fade-up mt-10 grid grid-cols-5 gap-2">
          {steps.map((s, i) => {
            const done = i <= currentStep;
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <span className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold ${done ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {i + 1}
                </span>
                <span className={`mt-2 text-[10px] font-semibold uppercase tracking-widest ${done ? "text-slate-800" : "text-slate-400"}`}>
                  {s}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="surface-soft mt-10 p-6">
        <h2 className="text-sm font-semibold text-slate-800">Kalemler</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{i.titleSnapshot}</p>
                <p className="text-xs text-slate-500">{priceFmt(i.unitPriceCents, order.currency)} x {i.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{priceFmt(i.unitPriceCents * i.quantity, order.currency)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600"><dt>Ara toplam</dt><dd>{priceFmt(subtotal, order.currency)}</dd></div>
          {!!order.discountCents && (
            <div className="flex justify-between text-emerald-700"><dt>İndirim {order.discountCode ? `(${order.discountCode})` : ""}</dt><dd>- {priceFmt(order.discountCents, order.currency)}</dd></div>
          )}
          {typeof order.shippingCents === "number" && (
            <div className="flex justify-between text-slate-600"><dt>Kargo</dt><dd>{order.shippingCents > 0 ? priceFmt(order.shippingCents, order.currency) : "Ücretsiz"}</dd></div>
          )}
          {!!order.taxCents && (
            <div className="flex justify-between text-slate-600"><dt>Vergi</dt><dd>{priceFmt(order.taxCents, order.currency)}</dd></div>
          )}
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
            <dt>Toplam</dt><dd>{priceFmt(order.totalCents, order.currency)}</dd>
          </div>
        </dl>

        {order.trackingNumber && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Kargo takip</p>
            <p className="mt-1 font-mono text-slate-900">{order.trackingNumber}</p>
          </div>
        )}
      </section>

      {(order.shippingLine1 || order.contactName) && (
        <section className="surface-soft mt-6 p-6">
          <h2 className="text-sm font-semibold text-slate-800">Teslimat bilgileri</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {order.contactName && <div><dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Alıcı</dt><dd className="mt-1 text-slate-800">{order.contactName}</dd></div>}
            {order.contactPhone && <div><dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Telefon</dt><dd className="mt-1 text-slate-800">{order.contactPhone}</dd></div>}
            {order.shippingLine1 && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Adres</dt>
                <dd className="mt-1 whitespace-pre-line text-slate-800">
                  {[order.shippingLine1, order.shippingLine2, [order.shippingDistrict, order.shippingCity, order.shippingPostalCode].filter(Boolean).join(" / "), order.shippingCountry ?? undefined].filter(Boolean).join("\n")}
                </dd>
              </div>
            )}
            {order.notes && <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Not</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{order.notes}</dd></div>}
          </dl>
        </section>
      )}

      <ReturnRequestForm orderId={order.id} orderStatus={order.status} items={order.items} existing={order.returns ?? []} />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/" className="btn-primary">Alışverişe devam</Link>
        <Link href={`/orders/${order.id}/fatura`} className="btn-ghost">Faturayı görüntüle</Link>
        <Link href="/hesap" className="btn-ghost">Hesabım</Link>
        <Link href="/hesap/iadeler" className="btn-ghost">İadelerim</Link>
        {order.status === "PENDING" && <CancelButton orderId={order.id} />}
      </div>
    </div>
  );
}
