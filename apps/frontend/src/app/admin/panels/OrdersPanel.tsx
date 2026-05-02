"use client";

import { Fragment, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { PATCHABLE_ORDER_STATUSES, ORDER_STATUS_LABELS, type PatchableOrderStatus } from "../constants/orders";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { AdminCard, Icon, StatusBadge } from "../ui";
import type { OrderRow } from "../types";

export function OrdersPanel({
  orders,
  orderStatusPick,
  setOrderStatusPick,
  busy,
  expandOrderId,
  setExpandOrderId,
  setDetailOrderId,
  updateOrderStatus,
  priceFmt,
}: {
  orders: OrderRow[];
  orderStatusPick: Record<string, string>;
  setOrderStatusPick: Dispatch<SetStateAction<Record<string, string>>>;
  busy: boolean;
  expandOrderId: string | null;
  setExpandOrderId: Dispatch<SetStateAction<string | null>>;
  setDetailOrderId: Dispatch<SetStateAction<string | null>>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  priceFmt: (cents: number, currency?: string) => string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmSave, setConfirmSave] = useState<{ orderId: string; status: string } | null>(null);

  const visible = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <>
      <ConfirmDialog
        open={!!confirmSave}
        title="Sipariş durumunu güncelle"
        description={
          confirmSave
            ? `Durum "${ORDER_STATUS_LABELS[confirmSave.status] ?? confirmSave.status}" olarak kaydedilecek. Bu işlem sipariş akışını günceller. Devam edilsin mi?`
            : ""
        }
        confirmLabel="Evet, kaydet"
        cancelLabel="Vazgeç"
        onCancel={() => setConfirmSave(null)}
        onConfirm={() => {
          if (!confirmSave) return;
          const { orderId, status } = confirmSave;
          setConfirmSave(null);
          void updateOrderStatus(orderId, status);
        }}
      />

      <AdminCard
        title="Siparişler"
        description={`${orders.length} kayıt${statusFilter !== "all" ? ` · ${visible.length} gösteriliyor` : ""}`}
        actions={
          <select
            className="input-soft !py-2 !text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tüm durumlar</option>
            {Object.keys(ORDER_STATUS_LABELS).map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        }
      >
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Henüz sipariş yok.</p>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Bu duruma ait sipariş yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">E-posta</th>
                  <th className="px-2 py-2">Durum</th>
                  <th className="px-2 py-2">Güncelle</th>
                  <th className="px-2 py-2">Tutar</th>
                  <th className="px-2 py-2">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((o) => {
                  const allStatuses = ["PENDING", ...PATCHABLE_ORDER_STATUSES] as const;
                  const selected = orderStatusPick[o.id] ?? o.status;
                  const canSave =
                    PATCHABLE_ORDER_STATUSES.includes(selected as PatchableOrderStatus) &&
                    selected !== o.status;
                  return (
                    <Fragment key={o.id}>
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-2 py-3 font-mono text-xs text-slate-500">{o.id.slice(0, 10)}…</td>
                        <td className="max-w-[160px] truncate px-2 py-3 text-xs text-slate-600">
                          {o.guestEmail ?? "—"}
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                              value={selected}
                              onChange={(e) =>
                                setOrderStatusPick((prev) => ({
                                  ...prev,
                                  [o.id]: e.target.value,
                                }))
                              }
                            >
                              {allStatuses.map((s) => (
                                <option key={s} value={s} disabled={s === "PENDING" && o.status !== "PENDING"}>
                                  {ORDER_STATUS_LABELS[s] ?? s}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={busy || !canSave}
                              onClick={() => setConfirmSave({ orderId: o.id, status: selected })}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                            >
                              <Icon.Check /> Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandOrderId((id) => (id === o.id ? null : o.id))}
                              className="text-xs font-semibold text-sky-800 hover:underline"
                            >
                              {expandOrderId === o.id ? "Gizle" : "Kalemler"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailOrderId(o.id)}
                              className="text-xs font-semibold text-slate-700 hover:underline"
                            >
                              Detay
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-3 font-semibold text-slate-900">
                          {priceFmt(o.totalCents, o.currency)}
                        </td>
                        <td className="px-2 py-3 text-xs text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                      {expandOrderId === o.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              Kalemler
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {(o.items ?? []).length === 0 && (
                                <li className="text-xs text-slate-500">Kalem yok.</li>
                              )}
                              {(o.items ?? []).map((it, idx) => (
                                <li
                                  key={idx}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-slate-100"
                                >
                                  <div className="min-w-0">
                                    <span className="font-semibold text-slate-800">{it.titleSnapshot}</span>
                                    {it.variantLabelSnapshot ? (
                                      <span className="mt-0.5 block text-[11px] font-medium text-violet-700">
                                        Seçenek: {it.variantLabelSnapshot}
                                      </span>
                                    ) : null}
                                  </div>
                                  <span className="shrink-0 text-slate-500">
                                    ×{it.quantity} @ {priceFmt(it.unitPriceCents, o.currency)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}
