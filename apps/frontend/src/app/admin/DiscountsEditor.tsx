"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";
import { AdminCard, Field, Icon, Toast } from "./ui";

type DiscountKind = "PERCENT" | "FIXED";

type DiscountRow = {
  id: string;
  code: string;
  kind: DiscountKind;
  value: number;
  minSubtotalCents: number;
  usageLimit: number;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
};

type FormState = {
  id: string | null;
  code: string;
  kind: DiscountKind;
  value: string;
  minSubtotal: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  description: string;
};

const emptyForm: FormState = {
  id: null,
  code: "",
  kind: "PERCENT",
  value: "10",
  minSubtotal: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  description: "",
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DiscountsEditor({ token }: { token: string }) {
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const list = (await adminFetch("/discounts", token)) as DiscountRow[];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setErr(msg);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = () => setForm(emptyForm);

  const edit = (row: DiscountRow) => {
    setForm({
      id: row.id,
      code: row.code,
      kind: row.kind,
      value:
        row.kind === "PERCENT" ? String(row.value) : String((row.value / 100).toFixed(2)),
      minSubtotal: row.minSubtotalCents ? String((row.minSubtotalCents / 100).toFixed(2)) : "",
      usageLimit: row.usageLimit ? String(row.usageLimit) : "",
      startsAt: toDateInput(row.startsAt),
      expiresAt: toDateInput(row.expiresAt),
      isActive: row.isActive,
      description: row.description ?? "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setErr(null);
    setSaved(false);
    setBusy(true);
    try {
      const valueNum = Number(form.value.replace(",", "."));
      const value =
        form.kind === "PERCENT" ? Math.round(valueNum) : Math.round(valueNum * 100);
      const payload = {
        code: form.code.trim().toUpperCase(),
        kind: form.kind,
        value,
        minSubtotalCents: form.minSubtotal
          ? Math.round(Number(form.minSubtotal.replace(",", ".")) * 100)
          : 0,
        usageLimit: form.usageLimit ? Math.max(0, parseInt(form.usageLimit, 10)) : 0,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
        description: form.description.trim() || null,
      };
      if (form.id) {
        await adminFetch(`/discounts/${form.id}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/discounts", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      reset();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, code: string) => {
    if (!window.confirm(`"${code}" indirim kodunu silmek istediğinize emin misiniz?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/discounts/${id}`, token, { method: "DELETE" });
      if (form.id === id) reset();
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {err && <Toast kind="error">{err}</Toast>}
      {saved && <Toast kind="success">İndirim kodu kaydedildi.</Toast>}

      <AdminCard
        title={form.id ? "İndirim kodunu düzenle" : "Yeni indirim kodu"}
        description="Müşteriler bu kodu checkout adımında kullanabilir."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Kod" hint="Büyük harfe çevrilir.">
            <input
              className="input-soft uppercase"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="HOSGELDIN20"
            />
          </Field>
          <Field label="Tip">
            <select
              className="input-soft"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as DiscountKind })}
            >
              <option value="PERCENT">Yüzdelik (%)</option>
              <option value="FIXED">Sabit tutar (₺)</option>
            </select>
          </Field>
          <Field
            label={form.kind === "PERCENT" ? "Oran (%)" : "Tutar (₺)"}
            hint={form.kind === "PERCENT" ? "1–99 arası" : "Sepetten düşülecek tutar"}
          >
            <input
              className="input-soft"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </Field>
          <Field label="Minimum sepet (₺)" hint="Boş bırakırsanız sınır yok.">
            <input
              className="input-soft"
              value={form.minSubtotal}
              onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
              placeholder="0"
            />
          </Field>
          <Field label="Kullanım limiti" hint="0 / boş = sınırsız">
            <input
              className="input-soft"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="0"
            />
          </Field>
          <Field label="Açıklama">
            <input
              className="input-soft"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Hoş geldin indirimi"
            />
          </Field>
          <Field label="Başlangıç">
            <input
              type="date"
              className="input-soft"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </Field>
          <Field label="Bitiş">
            <input
              type="date"
              className="input-soft"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </Field>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Aktif
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !form.code.trim() || !form.value.trim()}
            onClick={() => void save()}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Check />
            {form.id ? "Değişiklikleri kaydet" : "Kod oluştur"}
          </button>
          {form.id && (
            <button type="button" onClick={reset} className="btn-ghost">
              Yeni kod
            </button>
          )}
        </div>
      </AdminCard>

      <AdminCard title="Mevcut kodlar" description={`${rows.length} kayıt`}>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Henüz kod tanımlanmamış.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-2 py-2">Kod</th>
                  <th className="px-2 py-2">Tip</th>
                  <th className="px-2 py-2">Değer</th>
                  <th className="px-2 py-2">Min sepet</th>
                  <th className="px-2 py-2">Kullanım</th>
                  <th className="px-2 py-2">Geçerlilik</th>
                  <th className="px-2 py-2">Durum</th>
                  <th className="px-2 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-2 py-3 font-mono text-xs font-bold text-slate-900">
                      {r.code}
                    </td>
                    <td className="px-2 py-3 text-xs">
                      {r.kind === "PERCENT" ? "Yüzde" : "Sabit"}
                    </td>
                    <td className="px-2 py-3 font-semibold">
                      {r.kind === "PERCENT"
                        ? `%${r.value}`
                        : `${(r.value / 100).toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}`}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {r.minSubtotalCents > 0
                        ? (r.minSubtotalCents / 100).toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })
                        : "—"}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {r.usageCount}
                      {r.usageLimit > 0 ? ` / ${r.usageLimit}` : ""}
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {r.startsAt ? new Date(r.startsAt).toLocaleDateString("tr-TR") : "—"}
                      {" → "}
                      {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("tr-TR") : "∞"}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          r.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => edit(r)}
                        className="mr-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                      >
                        <Icon.Pencil /> Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(r.id, r.code)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Icon.Trash /> Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
