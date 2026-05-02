"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";

type MovementRow = {
  id: string;
  productId: string;
  productVariantId: string | null;
  delta: number;
  reason: string;
  orderId: string | null;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string; slug: string; stock: number } | null;
  productVariant: { id: string; label: string; stock: number } | null;
};

type LowStockRow = {
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    lowStockThreshold: number | null;
    category: { id: string; name: string } | null;
  };
  threshold: number;
  variant?: { id: string; label: string; stock: number };
};

const REASON_LABEL: Record<string, string> = {
  order_create: "Sipariş oluşturuldu",
  order_cancel: "Sipariş iptali",
  return: "İade",
  admin_adjust: "Manuel düzeltme",
};

export function StockMovementsPanel({ token }: { token: string }) {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [adjustBusy, setAdjustBusy] = useState(false);

  const [filterProductId, setFilterProductId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dirFilter, setDirFilter] = useState<"all" | "in" | "out">("all");

  const filteredMovements = useMemo(() => {
    let list = movements;
    const q = filterProductId.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.productId.toLowerCase().includes(q) ||
          (m.product?.name?.toLowerCase().includes(q) ?? false) ||
          (m.product?.slug?.toLowerCase().includes(q) ?? false),
      );
    }
    if (dateFrom) {
      const t = new Date(dateFrom).getTime();
      list = list.filter((m) => new Date(m.createdAt).getTime() >= t);
    }
    if (dateTo) {
      const t = new Date(dateTo);
      t.setHours(23, 59, 59, 999);
      list = list.filter((m) => new Date(m.createdAt).getTime() <= t.getTime());
    }
    if (dirFilter === "in") list = list.filter((m) => m.delta > 0);
    if (dirFilter === "out") list = list.filter((m) => m.delta < 0);
    return list;
  }, [movements, filterProductId, dateFrom, dateTo, dirFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, l] = await Promise.all([
        adminFetch("/products/admin/stock-movements", token) as Promise<MovementRow[]>,
        adminFetch("/products/admin/low-stock", token) as Promise<LowStockRow[]>,
      ]);
      setMovements(Array.isArray(m) ? m : []);
      setLowStock(Array.isArray(l) ? l : []);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Veri alınamadı");
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function adjust() {
    if (!productId.trim() || !delta.trim()) return;
    const d = parseInt(delta, 10);
    if (!Number.isFinite(d) || d === 0) {
      setError("Geçerli bir sayı girin (örn +5 veya -2)");
      return;
    }
    setAdjustBusy(true);
    setError(null);
    try {
      await adminFetch(`/products/admin/${productId.trim()}/adjust-stock`, token, {
        method: "POST",
        body: JSON.stringify({ delta: d, note: note.trim() || undefined }),
      });
      setProductId("");
      setDelta("");
      setNote("");
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Düzeltme başarısız");
      if (msg) setError(msg);
    } finally {
      setAdjustBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Stok hareketleri</h2>
        <p className="text-sm text-slate-600">
          Son sipariş, iptal, iade ve manuel düzeltmelerden kaynaklanan stok değişiklikleri.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Son hareketler</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className="input-soft min-w-[140px] flex-1 text-xs"
                placeholder="Ürün ara (ad / ID / slug)"
                value={filterProductId}
                onChange={(e) => setFilterProductId(e.target.value)}
              />
              <input
                type="date"
                className="input-soft w-[140px] text-xs"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <input
                type="date"
                className="input-soft w-[140px] text-xs"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
              <select
                className="input-soft w-36 text-xs"
                value={dirFilter}
                onChange={(e) => setDirFilter(e.target.value as "all" | "in" | "out")}
              >
                <option value="all">Tüm hareketler</option>
                <option value="in">Yalnız giriş (+)</option>
                <option value="out">Yalnız çıkış (−)</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="p-6 text-center text-sm text-slate-500">Yükleniyor…</p>
          ) : movements.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Kayıt yok.</p>
          ) : filteredMovements.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Filtreye uygun kayıt yok.</p>
          ) : (
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">Ürün / seçenek</th>
                    <th className="px-3 py-2">Sebep</th>
                    <th className="px-3 py-2 text-right">Değişim</th>
                    <th className="px-3 py-2 text-right">Kalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {new Date(m.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">
                          {m.product?.name ?? "—"}
                        </p>
                        {m.productVariant ? (
                          <p className="text-[11px] font-semibold text-violet-700">
                            {m.productVariant.label}
                          </p>
                        ) : null}
                        {m.orderId ? (
                          <p className="font-mono text-[10px] text-slate-400">
                            #{m.orderId.slice(0, 8)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {REASON_LABEL[m.reason] ?? m.reason}
                        {m.note ? <span className="block text-slate-400">{m.note}</span> : null}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          m.delta > 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        {m.productVariant?.stock ?? m.product?.stock ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Manuel düzeltme</h3>
            <p className="mt-1 text-xs text-slate-500">
              Pozitif değer stok girişi, negatif değer çıkış. Ürün ID&apos;sini Ürünler sekmesinden
              alabilirsiniz.
            </p>
            <div className="mt-3 space-y-2">
              <input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Ürün ID"
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm"
              />
              <input
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="+5 veya -2"
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Not (opsiyonel)"
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => void adjust()}
                disabled={adjustBusy}
                className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Uygula
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-amber-900">
              Kritik stok ({lowStock.length})
            </h3>
            {lowStock.length === 0 ? (
              <p className="mt-2 text-xs text-amber-800/80">Eşik altında ürün yok.</p>
            ) : (
              <ul className="mt-2 divide-y divide-amber-100 text-sm">
                {lowStock.slice(0, 20).map((row) => (
                  <li
                    key={row.variant ? `${row.product.id}-${row.variant.id}` : row.product.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div>
                      <p className="font-medium text-amber-900">{row.product.name}</p>
                      {row.variant ? (
                        <p className="text-[11px] font-semibold text-violet-800">{row.variant.label}</p>
                      ) : null}
                      <p className="text-[11px] text-amber-800/70">
                        Eşik: {row.threshold}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        (row.variant?.stock ?? row.product.stock) <= 0
                          ? "bg-rose-200 text-rose-900"
                          : "bg-amber-200 text-amber-900"
                      }`}
                    >
                      {row.variant?.stock ?? row.product.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
