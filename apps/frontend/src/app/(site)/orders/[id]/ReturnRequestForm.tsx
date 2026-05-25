"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { getCustomerToken } from "@/lib/platform-session";

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

function ExistingReturnsList({ existing }: { existing: ExistingReturn[] }) {
  if (!existing.length) return null;
  return (
    <ul className="mt-3 divide-y divide-white/10 text-sm">
      {existing.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{r.status}</p>
            <p className="mt-0.5 text-slate-200">{r.reason}</p>
          </div>
          <p className="shrink-0 text-xs text-slate-500">
            {new Date(r.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </li>
      ))}
    </ul>
  );
}

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
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(Boolean(getCustomerToken()));
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

  const toggleItem = (id: string, remaining: number) => {
    if (remaining <= 0) return;
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!authed || !eligibleStatus || !hasAnyRemaining) {
    return (
      <section className="si-order-panel mt-6 p-6">
        <h2 className="text-sm font-semibold text-slate-100">İade talebi</h2>
        <ExistingReturnsList existing={existing} />
        {!existing.length && (
          <p className="mt-2 text-xs text-slate-400">
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
    const lines = returnable
      .filter((it) => selected[it.id] && it.remaining > 0)
      .map((it) => ({ orderItemId: it.id, quantity: it.remaining }));
    if (!lines.length) {
      setError("İade etmek istediğiniz ürünleri işaretleyin.");
      return;
    }
    if (reason.trim().length < 4) {
      setError("Lütfen iade sebebini detaylandırın.");
      return;
    }
    setBusy(true);
    try {
      const token = getCustomerToken();
      const res = await fetch(apiUrl("/returns"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, reason: reason.trim(), items: lines }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/hesap/iadeler");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="si-order-panel mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">İade talebi</h2>
          <p className="mt-1 text-xs text-slate-400">
            İade etmek istediğiniz ürünleri işaretleyin. Admin onayı sonrası kargo yönlendirmesi size
            iletilir.
          </p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost">
          {open ? "Kapat" : "Talep oluştur"}
        </button>
      </div>

      <ExistingReturnsList existing={existing} />

      {open && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <ul className="space-y-2 text-sm">
            {returnable.map((it) => {
              const disabled = it.remaining === 0;
              const checked = Boolean(selected[it.id]);
              return (
                <li key={it.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      disabled
                        ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-500"
                        : checked
                          ? "border-sky-500/40 bg-sky-500/10"
                          : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-[#0a0f18] text-sky-500 focus:ring-sky-500/40"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleItem(it.id, it.remaining)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100">{it.titleSnapshot}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Sipariş miktarı: {it.quantity}
                        {it.remaining > 0 ? ` · İade edilebilir: ${it.remaining}` : " · İade edilemez"}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          <textarea
            placeholder="İade sebebini detaylandırın"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="input-soft w-full resize-y"
          />

          {error ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={submit} className="btn-primary disabled:opacity-50">
              {busy ? "Gönderiliyor…" : "Talebi gönder"}
            </button>
            <button type="button" disabled={busy} onClick={() => setOpen(false)} className="btn-ghost">
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
