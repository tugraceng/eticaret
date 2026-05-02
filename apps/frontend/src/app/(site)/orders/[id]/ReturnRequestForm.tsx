"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";

export type OrderItemLite = {
  id: string;
  titleSnapshot: string;
  quantity: number;
};

export type ExistingReturn = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  createdAt: string;
  reason: string;
  items: { orderItemId: string; quantity: number }[];
};

export function ReturnRequestForm({
  orderId,
  orderStatus,
  items,
  existing,
}: {
  orderId: string;
  orderStatus: string;
  items: OrderItemLite[];
  existing: ExistingReturn[];
}) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(Boolean(sessionStorage.getItem(CUSTOMER_TOKEN_KEY)));
  }, []);

  const blockedAlready = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of existing) {
      if (r.status === "REJECTED") continue;
      for (const it of r.items) {
        map.set(it.orderItemId, (map.get(it.orderItemId) ?? 0) + it.quantity);
      }
    }
    return map;
  }, [existing]);

  const returnable = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        remaining: Math.max(0, it.quantity - (blockedAlready.get(it.id) ?? 0)),
      })),
    [items, blockedAlready],
  );

  const hasAnyRemaining = returnable.some((i) => i.remaining > 0);
  const eligibleStatus = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus);

  if (!authed || !eligibleStatus || !hasAnyRemaining) {
    return (
      <section className="card-soft mt-6 p-6">
        <h2 className="text-sm font-semibold text-slate-800">İade talebi</h2>
        {existing.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {existing.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {r.status}
                  </p>
                  <p className="mt-0.5 text-slate-800">{r.reason}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            {!authed
              ? "İade talebi oluşturmak için hesabınıza giriş yapın."
              : !eligibleStatus
                ? "Bu siparişin durumu iade için uygun değil. Yalnızca ödenmiş veya kargolanmış siparişler iade edilebilir."
                : "Bu siparişteki tüm kalemler için iade talebi zaten açıldı."}
          </p>
        )}
      </section>
    );
  }

  const submit = async () => {
    setError(null);
    const lines = Object.entries(qty)
      .filter(([, v]) => v > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!lines.length) {
      setError("En az bir kalem için miktar girin.");
      return;
    }
    if (reason.trim().length < 4) {
      setError("Lütfen iade sebebini detaylandırın.");
      return;
    }
    setBusy(true);
    try {
      const token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
      const res = await fetch(apiUrl("/returns"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, reason: reason.trim(), items: lines }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      setReason("");
      setQty({});
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-soft mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">İade talebi</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ürünleri iade etmek isterseniz aşağıdan talebinizi oluşturun. Admin onayı sonrası kargo
            yönlendirmesi size iletilir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost"
        >
          {open ? "Kapat" : "Talep oluştur"}
        </button>
      </div>

      {existing.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {existing.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {r.status}
                </p>
                <p className="mt-0.5 text-slate-800">{r.reason}</p>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(r.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <ul className="space-y-2 text-sm">
            {returnable.map((it) => (
              <li
                key={it.id}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                  it.remaining === 0
                    ? "border-slate-100 bg-slate-50 text-slate-400"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <p className="font-medium">{it.titleSnapshot}</p>
                  <p className="text-xs text-slate-500">
                    Sipariş miktarı: {it.quantity} · İade edilebilir: {it.remaining}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={it.remaining}
                  disabled={it.remaining === 0}
                  value={qty[it.id] ?? ""}
                  onChange={(e) =>
                    setQty((q) => ({
                      ...q,
                      [it.id]: Math.max(
                        0,
                        Math.min(it.remaining, Number(e.target.value) || 0),
                      ),
                    }))
                  }
                  className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                />
              </li>
            ))}
          </ul>

          <textarea
            placeholder="İade sebebini detaylandırın"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-200 p-2 text-sm"
          />

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="btn-primary disabled:opacity-50"
            >
              {busy ? "Gönderiliyor…" : "Talebi gönder"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="btn-ghost"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
