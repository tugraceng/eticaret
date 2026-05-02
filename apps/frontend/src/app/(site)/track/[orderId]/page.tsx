import Link from "next/link";
import { notFound } from "next/navigation";
import { apiJson } from "@/lib/api";

type TrackOrder = {
  id: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  totalCents: number;
  currency: string;
  contactName: string | null;
  shippingCity: string | null;
  shippingCountry: string | null;
};

const statusLabel: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

function money(cents: number, currency: string) {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency });
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  let order: TrackOrder | null = null;
  try {
    order = await apiJson<TrackOrder>(`/orders/${orderId}`);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="surface-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Takip</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Sipariş #{order.id.slice(-8).toUpperCase()}
            </h1>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              statusTone[order.status] ?? "bg-slate-100 text-slate-700"
            }`}
          >
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">Müşteri</dt>
            <dd className="mt-1 text-slate-800">{order.contactName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tarih</dt>
            <dd className="mt-1 text-slate-800">
              {new Date(order.createdAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tutar</dt>
            <dd className="mt-1 text-slate-800">{money(order.totalCents, order.currency)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">Teslimat</dt>
            <dd className="mt-1 text-slate-800">
              {[order.shippingCity, order.shippingCountry].filter(Boolean).join(", ") || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">Kargo takip no</dt>
            <dd className="mt-1 text-slate-800">{order.trackingNumber || "Henüz atanmadı"}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/orders/${order.id}`} className="btn-primary">
            Sipariş detayına git →
          </Link>
          <Link href="/orders" className="btn-ghost">
            Siparişlerim
          </Link>
        </div>
      </div>
    </main>
  );
}

