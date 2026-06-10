"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import { orderStatusHeadlineTr, orderStatusLabelTr } from "@/lib/order-status-tr";
import { orderListStatusBadgeClass, orderListStatusLabel } from "@/lib/order-display-status";
import { carrierTrackingLink, CARRIER_LABELS, type ShippingCarrier } from "@/lib/shipping-tracking";
import { getCustomerToken } from "@/lib/platform-session";
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
  carrier?: ShippingCarrier | null;
  paymentMethod?: "CARD" | "BANK_TRANSFER";
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
      const token = getCustomerToken()?.trim();
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

  const currentStep =
    order?.status === "CANCELLED" ? -1 : steps.indexOf(order?.status as (typeof steps)[number]);
  const subtotal = useMemo(
    () => order?.subtotalCents ?? order?.items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0) ?? 0,
    [order],
  );

  if (phase === "loading") {
    return (
      <main className="si-order-detail-page mx-auto max-w-7xl px-4 py-12 text-sm text-slate-400 sm:px-6 lg:px-8">
        Sipariş doğrulanıyor…
      </main>
    );
  }

  if (phase === "login" || !order) {
    return (
      <main className="si-order-detail-page mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="si-order-panel p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sipariş takibi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Hesabınıza giriş yapın</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sipariş detayları yalnızca siparişi veren müşteri hesabında görüntülenebilir.
          </p>
          {error && (
            <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </p>
          )}
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
    <div className="si-order-detail-page mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href="/" className="link-underline text-sm text-slate-400 hover:text-slate-200">
        Alışverişe dön
      </Link>

      <div className="fade-up si-order-panel mt-6 flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sipariş takibi</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {orderStatusHeadlineTr(order.status)}
          </h1>
          <p className="mt-2 break-all font-mono text-xs text-slate-500">#{order.id}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${orderListStatusBadgeClass(order.status, order.returns)}`}
        >
          {orderListStatusLabel(order.status, order.returns)}
        </span>
      </div>

      {currentStep >= 0 && (
        <ol className="si-order-stepper fade-up mt-8 sm:mt-10">
          {steps.map((s, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <li key={s} className="si-order-step">
                <span
                  className={`si-order-step-dot ${done ? "si-order-step-dot-done" : ""} ${active ? "si-order-step-dot-active" : ""}`}
                >
                  {i + 1}
                </span>
                <span className={`si-order-step-label ${done ? "si-order-step-label-done" : ""}`}>
                  {orderStatusLabelTr(s)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="si-order-panel mt-8 p-6 sm:mt-10">
        <h2 className="text-sm font-semibold text-slate-100">Kalemler</h2>
        <ul className="mt-4 divide-y divide-white/10">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-slate-100">{i.titleSnapshot}</p>
                <p className="text-xs text-slate-400">
                  {priceFmt(i.unitPriceCents, order.currency)} × {i.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-100">
                {priceFmt(i.unitPriceCents * i.quantity, order.currency)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <dt>Ara toplam</dt>
            <dd>{priceFmt(subtotal, order.currency)}</dd>
          </div>
          {!!order.discountCents && (
            <div className="flex justify-between text-emerald-400">
              <dt>İndirim {order.discountCode ? `(${order.discountCode})` : ""}</dt>
              <dd>- {priceFmt(order.discountCents, order.currency)}</dd>
            </div>
          )}
          {typeof order.shippingCents === "number" && (
            <div className="flex justify-between text-slate-400">
              <dt>Kargo</dt>
              <dd>{order.shippingCents > 0 ? priceFmt(order.shippingCents, order.currency) : "Ücretsiz"}</dd>
            </div>
          )}
          {!!order.taxCents && (
            <div className="flex justify-between text-slate-400">
              <dt>Vergi</dt>
              <dd>{priceFmt(order.taxCents, order.currency)}</dd>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-white">
            <dt>Toplam</dt>
            <dd>{priceFmt(order.totalCents, order.currency)}</dd>
          </div>
        </dl>

        {order.trackingNumber && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Kargo takip</p>
            {order.carrier ? (
              <p className="mt-1 text-slate-300">{CARRIER_LABELS[order.carrier] ?? order.carrier}</p>
            ) : null}
            <p className="mt-1 break-all font-mono text-slate-100">{order.trackingNumber}</p>
            {(() => {
              const link = carrierTrackingLink(order.carrier, order.trackingNumber);
              if (!link) return null;
              return (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-3 inline-flex min-h-10 text-sm"
                >
                  {link.label} — Kargoyu Takip Et
                </a>
              );
            })()}
          </div>
        )}
      </section>

      {(order.shippingLine1 || order.contactName) && (
        <section className="si-order-panel mt-6 p-6">
          <h2 className="text-sm font-semibold text-slate-100">Teslimat bilgileri</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {order.contactName && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Alıcı</dt>
                <dd className="mt-1 text-slate-200">{order.contactName}</dd>
              </div>
            )}
            {order.contactPhone && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Telefon</dt>
                <dd className="mt-1 text-slate-200">{order.contactPhone}</dd>
              </div>
            )}
            {order.shippingLine1 && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Adres</dt>
                <dd className="mt-1 whitespace-pre-line text-slate-200">
                  {[
                    order.shippingLine1,
                    order.shippingLine2,
                    [order.shippingDistrict, order.shippingCity, order.shippingPostalCode]
                      .filter(Boolean)
                      .join(" / "),
                    order.shippingCountry ?? undefined,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                </dd>
              </div>
            )}
            {order.notes && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Not</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-300">{order.notes}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <ReturnRequestForm
        orderId={order.id}
        orderStatus={order.status}
        items={order.items}
        existing={order.returns ?? []}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/" className="btn-primary">
          Alışverişe devam
        </Link>
        <Link href={`/orders/${order.id}/fatura`} className="btn-ghost">
          Faturayı görüntüle
        </Link>
        <Link href="/hesap" className="btn-ghost">
          Hesabım
        </Link>
        <Link href="/hesap/iadeler" className="btn-ghost">
          İadelerim
        </Link>
        {order.status === "PENDING" && <CancelButton orderId={order.id} />}
      </div>
    </div>
  );
}
