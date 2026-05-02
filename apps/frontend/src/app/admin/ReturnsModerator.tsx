"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";

type ReturnRow = {
  id: string;
  orderId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  reason: string;
  note: string | null;
  refundStatus?: string | null;
  refundCents?: number | null;
  refundDetail?: string | null;
  createdAt: string;
  decidedAt: string | null;
  items: {
    id: string;
    quantity: number;
    orderItem: { titleSnapshot: string; productId: string };
  }[];
  order: {
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    guestEmail: string | null;
    contactName: string | null;
    contactPhone: string | null;
  };
  user: { id: string; email: string; name: string | null } | null;
};

type Filter = "pending" | "decided" | "all";

const STATUS_LABEL: Record<ReturnRow["status"], string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylı",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı",
};

const STATUS_STYLE: Record<ReturnRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-rose-100 text-rose-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export function ReturnsModerator({ token }: { token: string }) {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await adminFetch(`/admin/returns?filter=${filter}`, token)) as ReturnRow[];
      setRows(Array.isArray(res) ? res : []);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İadeler alınamadı");
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(
    id: string,
    decision: "APPROVED" | "REJECTED" | "COMPLETED",
    restock?: boolean,
  ) {
    setBusy(id);
    try {
      await adminFetch(`/admin/returns/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          decision,
          note: noteDraft[id]?.trim() || undefined,
          restock,
        }),
      });
      setNoteDraft((d) => ({ ...d, [id]: "" }));
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setError(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">İade talepleri</h2>
          <p className="text-sm text-slate-600">
            Müşteri iade taleplerini onaylayın/reddedin. Onayda iyzico ödemesi varsa kalem bazlı
            iade denenir; mock ödemede atlanır. Tamamlandığında (istenirse) ürünler stoğa iade
            edilir.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {(["pending", "decided", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded-md bg-slate-900 px-3 py-1.5 text-white"
                  : "rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              }
            >
              {f === "pending" ? "Bekleyen" : f === "decided" ? "Sonuçlanan" : "Tümü"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Yükleniyor…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Bu kategoride iade talebi yok.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const qty = r.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <article
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        Sipariş #{r.order.id.slice(0, 8)}
                      </span>
                      <span className="text-slate-500">
                        {new Date(r.createdAt).toLocaleString("tr-TR")}
                      </span>
                      <span className="text-slate-500">· {qty} adet</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {r.user?.email || r.order.guestEmail || r.order.contactName || "Misafir"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-slate-900">
                      {(r.order.totalCents / 100).toLocaleString("tr-TR", {
                        style: "currency",
                        currency: r.order.currency,
                      })}
                    </p>
                    <p className="text-xs text-slate-500">Sipariş durumu: {r.order.status}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium">Sebep</p>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{r.reason}</p>
                </div>

                <ul className="mt-3 divide-y divide-slate-100 text-sm">
                  {r.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between py-1.5">
                      <span>{it.orderItem.titleSnapshot}</span>
                      <span className="text-slate-500">×{it.quantity}</span>
                    </li>
                  ))}
                </ul>

                {r.note ? (
                  <p className="mt-2 rounded-md bg-slate-100 p-2 text-xs text-slate-600">
                    <span className="font-semibold">Admin notu:</span> {r.note}
                  </p>
                ) : null}

                {r.refundStatus ? (
                  <p className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700">
                    <span className="font-semibold">Ödeme iadesi:</span> {r.refundStatus}
                    {typeof r.refundCents === "number"
                      ? ` · ${(r.refundCents / 100).toLocaleString("tr-TR", {
                          style: "currency",
                          currency: r.order.currency,
                        })}`
                      : ""}
                    {r.refundDetail ? (
                      <span className="mt-1 block text-slate-500">{r.refundDetail}</span>
                    ) : null}
                  </p>
                ) : null}

                {r.status === "PENDING" || r.status === "APPROVED" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      placeholder="İsteğe bağlı not (müşteriye e-posta olarak iletilir)"
                      value={noteDraft[r.id] ?? ""}
                      onChange={(e) =>
                        setNoteDraft((d) => ({ ...d, [r.id]: e.target.value }))
                      }
                      className="min-w-[200px] flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm"
                    />
                    {r.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => decide(r.id, "APPROVED")}
                          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => decide(r.id, "REJECTED")}
                          className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Reddet
                        </button>
                      </>
                    ) : null}
                    {r.status === "APPROVED" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => decide(r.id, "COMPLETED", true)}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Tamamla (stoğa iade et)
                        </button>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => decide(r.id, "COMPLETED", false)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Tamamla (stoksuz)
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
