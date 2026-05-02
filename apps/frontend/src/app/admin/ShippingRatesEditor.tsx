"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";

type Rate = {
  id: string;
  country: string;
  city: string | null;
  feeCents: number;
  freeThresholdCents: number;
  isActive: boolean;
  sortOrder: number;
};

type Draft = {
  country: string;
  city: string;
  feeTL: string;
  freeThresholdTL: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_DRAFT: Draft = {
  country: "TR",
  city: "",
  feeTL: "",
  freeThresholdTL: "",
  isActive: true,
  sortOrder: 0,
};

function centsToTL(c: number) {
  return (c / 100).toFixed(2).replace(".", ",");
}

function tlToCents(s: string): number {
  const n = Number(String(s).replace(/,/g, "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function ShippingRatesEditor({ token }: { token: string }) {
  const [rows, setRows] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await adminFetch(`/shipping-rates`, token)) as Rate[];
      setRows(res);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Yüklenemedi");
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    try {
      const body = JSON.stringify({
        country: draft.country.trim().toUpperCase() || "TR",
        city: draft.city.trim() || null,
        feeCents: tlToCents(draft.feeTL),
        freeThresholdCents: tlToCents(draft.freeThresholdTL),
        isActive: draft.isActive,
        sortOrder: Number(draft.sortOrder) || 0,
      });
      if (editing) {
        await adminFetch(`/shipping-rates/${editing}`, token, { method: "PATCH", body });
      } else {
        await adminFetch(`/shipping-rates`, token, { method: "POST", body });
      }
      setDraft(EMPTY_DRAFT);
      setEditing(null);
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Kaydedilemedi");
      if (msg) setError(msg);
    }
  }

  function startEdit(r: Rate) {
    setEditing(r.id);
    setDraft({
      country: r.country,
      city: r.city ?? "",
      feeTL: centsToTL(r.feeCents),
      freeThresholdTL: centsToTL(r.freeThresholdCents),
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    });
  }

  async function remove(id: string) {
    if (!confirm("Silinsin mi?")) return;
    setBusy(id);
    try {
      await adminFetch(`/shipping-rates/${id}`, token, { method: "DELETE" });
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Silinemedi");
      if (msg) setError(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Kargo matrisi</h2>
        <p className="text-sm text-slate-600">
          Şehir veya ülkeye göre kargo ücreti ve ücretsiz kargo eşiği belirleyin. Şehir bırakılırsa
          ülke geneli uygulanır.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium">
          {editing ? "Kuralı düzenle" : "Yeni kural ekle"}
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <label className="text-xs text-slate-600">
            Ülke
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              value={draft.country}
              maxLength={2}
              onChange={(e) => setDraft({ ...draft, country: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="col-span-2 text-xs text-slate-600">
            Şehir (boş = ülke geneli)
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              value={draft.city}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              placeholder="İstanbul"
            />
          </label>
          <label className="text-xs text-slate-600">
            Ücret (TL)
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              value={draft.feeTL}
              onChange={(e) => setDraft({ ...draft, feeTL: e.target.value })}
              inputMode="decimal"
            />
          </label>
          <label className="text-xs text-slate-600">
            Ücretsiz eşik (TL)
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              value={draft.freeThresholdTL}
              onChange={(e) => setDraft({ ...draft, freeThresholdTL: e.target.value })}
              inputMode="decimal"
              placeholder="0 = yok"
            />
          </label>
          <label className="flex items-end gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
            Aktif
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {editing ? "Güncelle" : "Ekle"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setDraft(EMPTY_DRAFT);
              }}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              İptal
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Henüz kural yok. Varsayılan olarak site ayarlarındaki kargo ücreti uygulanır.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Ülke</th>
                <th className="px-3 py-2">Şehir</th>
                <th className="px-3 py-2">Ücret</th>
                <th className="px-3 py-2">Ücretsiz eşik</th>
                <th className="px-3 py-2">Aktif</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.country}</td>
                  <td className="px-3 py-2">{r.city ?? <em className="text-slate-400">ülke geneli</em>}</td>
                  <td className="px-3 py-2">{centsToTL(r.feeCents)} TL</td>
                  <td className="px-3 py-2">
                    {r.freeThresholdCents > 0 ? `${centsToTL(r.freeThresholdCents)} TL` : "-"}
                  </td>
                  <td className="px-3 py-2">{r.isActive ? "Evet" : "Hayır"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="mr-2 rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => remove(r.id)}
                      className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
