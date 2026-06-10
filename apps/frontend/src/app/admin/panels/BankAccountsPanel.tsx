"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../api";
import { formatAdminCaughtError } from "../admin-api-error";
import { AdminCard, Field, Icon } from "../ui";

type BankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  branch?: string | null;
  notes?: string | null;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  bankName: "",
  accountHolder: "",
  iban: "",
  branch: "",
  notes: "",
  isActive: true,
};

export function BankAccountsPanel({ token }: { token: string }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = (await adminFetch("/bank-accounts/admin", token)) as BankAccount[];
      setAccounts(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(formatAdminCaughtError(e, "Banka hesapları yüklenemedi") ?? "Banka hesapları yüklenemedi");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const save = async () => {
    if (!form.bankName.trim() || !form.accountHolder.trim() || !form.iban.trim()) {
      setError("Banka adı, hesap sahibi ve IBAN zorunludur.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        bankName: form.bankName.trim(),
        accountHolder: form.accountHolder.trim(),
        iban: form.iban.replace(/\s/g, ""),
        branch: form.branch.trim() || null,
        notes: form.notes.trim() || null,
        isActive: form.isActive,
      };
      if (editingId) {
        await adminFetch(`/bank-accounts/admin/${editingId}`, token, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/bank-accounts/admin", token, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await load();
    } catch (e) {
      setError(formatAdminCaughtError(e, "Banka hesapları yüklenemedi") ?? "Banka hesapları yüklenemedi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu banka hesabı silinsin mi?")) return;
    setBusy(true);
    try {
      await adminFetch(`/bank-accounts/admin/${id}`, token, { method: "DELETE" });
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError(formatAdminCaughtError(e, "Banka hesapları yüklenemedi") ?? "Banka hesapları yüklenemedi");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (a: BankAccount) => {
    setEditingId(a.id);
    setForm({
      bankName: a.bankName,
      accountHolder: a.accountHolder,
      iban: a.iban,
      branch: a.branch ?? "",
      notes: a.notes ?? "",
      isActive: a.isActive,
    });
  };

  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = accounts.findIndex((a) => a.id === dragId);
    const to = accounts.findIndex((a) => a.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...accounts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setAccounts(next);
    setDragId(null);
    try {
      await adminFetch("/bank-accounts/admin/reorder", token, {
        method: "PATCH",
        body: JSON.stringify({ ids: next.map((a) => a.id) }),
      });
    } catch (e) {
      setError(formatAdminCaughtError(e, "Banka hesapları yüklenemedi") ?? "Banka hesapları yüklenemedi");
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard
        title="Havale / EFT banka hesapları"
        description="Checkout’ta müşteriye gösterilecek hesaplar. Sıralamayı sürükleyerek değiştirebilirsiniz."
      >
        {error ? (
          <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <Field label="Banka adı *">
            <input
              className="input-soft"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            />
          </Field>
          <Field label="Hesap sahibi *">
            <input
              className="input-soft"
              value={form.accountHolder}
              onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
            />
          </Field>
          <Field label="IBAN *">
            <input
              className="input-soft font-mono text-sm"
              value={form.iban}
              onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
          </Field>
          <Field label="Şube (isteğe bağlı)">
            <input
              className="input-soft"
              value={form.branch}
              onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
            />
          </Field>
          <Field label="Not (müşteriye gösterilir)">
            <textarea
              rows={2}
              className="input-soft resize-y md:col-span-2"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Aktif (checkout’ta göster)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void save()} className="btn-primary disabled:opacity-50">
            <Icon.Check /> {editingId ? "Güncelle" : "Hesap ekle"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="btn-ghost">
              İptal
            </button>
          ) : null}
        </div>

        <ul className="mt-6 space-y-2">
          {accounts.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              Henüz banka hesabı yok.
            </li>
          ) : (
            accounts.map((a) => (
              <li
                key={a.id}
                draggable
                onDragStart={() => setDragId(a.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void onDrop(a.id)}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 ${
                  dragId === a.id ? "opacity-60" : ""
                } ${!a.isActive ? "opacity-70" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {a.bankName}
                    {!a.isActive ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-slate-400">Pasif</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-slate-600">{a.accountHolder}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{a.iban}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="cursor-grab text-slate-400" title="Sürükle">
                    ⋮⋮
                  </span>
                  <button type="button" className="text-xs font-semibold text-sky-800 hover:underline" onClick={() => startEdit(a)}>
                    Düzenle
                  </button>
                  <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => void remove(a.id)}>
                    Sil
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </AdminCard>
    </div>
  );
}
