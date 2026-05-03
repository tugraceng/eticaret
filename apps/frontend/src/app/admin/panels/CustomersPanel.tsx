"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../api";
import { AdminCard } from "../ui";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";

export type AdminCustomerRow = {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  marketingOptIn: boolean;
  birthDate: string | null;
  createdAt: string;
  customer: { id: string; _count: { orders: number } } | null;
};

export function CustomersPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = (await adminFetch("/customers/admin", token)) as AdminCustomerRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminCard
      title="Müşteriler"
      description="Kayıtlı müşteri hesapları (CUSTOMER). Sipariş sayısı müşteri kaydı üzerinden."
    >
      {loading ? (
        <LoadingSkeleton className="h-40" />
      ) : err ? (
        <pre className="overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{err}</pre>
      ) : rows.length === 0 ? (
        <EmptyState title="Kayıtlı müşteri yok" hint="İlk kayıt veya sipariş sonrası burada listelenir." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Ad</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Sipariş</th>
                <th className="px-4 py-3">Kampanya izni</th>
                <th className="px-4 py-3">Kayıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const full = [r.name, r.surname].filter(Boolean).join(" ").trim() || "—";
                const orderCount = r.customer?._count?.orders ?? 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{r.email}</td>
                    <td className="px-4 py-2.5 text-slate-700">{full}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.phone ?? "—"}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{orderCount}</td>
                    <td className="px-4 py-2.5">{r.marketingOptIn ? "Evet" : "Hayır"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}
