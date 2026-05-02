"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { slugifyTr } from "../utils/slug";
import { AdminCard, Field, Icon } from "../ui";
import type { CategoryRow } from "../types";

export function CategoriesPanel({
  busy,
  categories,
  catName,
  catSlug,
  setCatName,
  setCatSlug,
  createCategory,
  deleteCategory,
  updateCategory,
}: {
  busy: boolean;
  categories: CategoryRow[];
  catName: string;
  catSlug: string;
  setCatName: Dispatch<SetStateAction<string>>;
  setCatSlug: Dispatch<SetStateAction<string>>;
  createCategory: () => Promise<void>;
  deleteCategory: (id: string, name: string) => Promise<void>;
  updateCategory: (id: string, payload: { name: string; slug: string }) => Promise<void>;
}) {
  const newSlugTouched = useRef(false);
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  useEffect(() => {
    if (!catName && !catSlug) newSlugTouched.current = false;
  }, [catName, catSlug]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return categories;
    return categories.filter(
      (c) => c.name.toLowerCase().includes(t) || c.slug.toLowerCase().includes(t),
    );
  }, [categories, q]);

  const openEdit = (c: CategoryRow) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Yeni kategori" description="Ad yazıldığında slug otomatik önerilir; isterseniz slug alanını kendiniz düzenleyin.">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            placeholder="Ad"
            className="input-soft"
            value={catName}
            onChange={(e) => {
              const v = e.target.value;
              setCatName(v);
              if (!newSlugTouched.current) setCatSlug(slugifyTr(v));
            }}
          />
          <input
            placeholder="slug-ornek"
            className="input-soft font-mono text-sm"
            value={catSlug}
            onChange={(e) => {
              newSlugTouched.current = true;
              setCatSlug(e.target.value);
            }}
          />
          <button
            type="button"
            disabled={busy || !catName.trim() || !catSlug.trim()}
            onClick={() => void createCategory()}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Plus /> Ekle
          </button>
        </div>
      </AdminCard>

      <AdminCard
        title="Kategoriler"
        description={`${categories.length} kayıt${q.trim() ? ` · ${filtered.length} eşleşme` : ""}`}
        actions={
          <input
            placeholder="Ara…"
            className="input-soft !py-2 !text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      >
        {categories.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Henüz kategori yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-2 py-2">Ad</th>
                  <th className="px-2 py-2">Slug</th>
                  <th className="px-2 py-2">Üst</th>
                  <th className="px-2 py-2">Ürün</th>
                  <th className="px-2 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-2 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-2 py-3 font-mono text-xs text-slate-500">{c.slug}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {c.parentId ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">Alt kategori</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-slate-700">{c._count?.products ?? 0}</td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                      >
                        <Icon.Pencil /> Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCategory(c.id, c.name)}
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

      {editId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Kategori düzenle</h3>
            <p className="mt-1 text-xs text-slate-500">Ad ve adres (slug) güncellenir.</p>
            <div className="mt-4 space-y-3">
              <Field label="Ad">
                <input className="input-soft" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </Field>
              <Field label="Slug">
                <input
                  className="input-soft font-mono text-sm"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditId(null)}>
                Vazgeç
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={busy || !editName.trim() || !editSlug.trim()}
                onClick={() =>
                  void updateCategory(editId, { name: editName, slug: editSlug }).then(() => setEditId(null))
                }
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
