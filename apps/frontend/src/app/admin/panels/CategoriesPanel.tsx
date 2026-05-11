"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { slugifyTr } from "../utils/slug";
import { AdminCard, Field, Icon } from "../ui";
import type { CategoryRow } from "../types";

function collectDescendantIds(rows: CategoryRow[], rootId: string): Set<string> {
  const byParent = new Map<string | null, string[]>();
  for (const c of rows) {
    const p = c.parentId ?? null;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(c.id);
  }
  const out = new Set<string>();
  const stack = [...(byParent.get(rootId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    out.add(id);
    const ch = byParent.get(id);
    if (ch) stack.push(...ch);
  }
  return out;
}

export function CategoriesPanel({
  busy,
  categories,
  catName,
  catSlug,
  catParentId,
  setCatName,
  setCatSlug,
  setCatParentId,
  createCategory,
  deleteCategory,
  updateCategory,
}: {
  busy: boolean;
  categories: CategoryRow[];
  catName: string;
  catSlug: string;
  catParentId: string;
  setCatName: Dispatch<SetStateAction<string>>;
  setCatSlug: Dispatch<SetStateAction<string>>;
  setCatParentId: Dispatch<SetStateAction<string>>;
  createCategory: () => Promise<void>;
  deleteCategory: (id: string, name: string) => Promise<void>;
  updateCategory: (id: string, payload: { name: string; slug: string; parentId: string | null }) => Promise<void>;
}) {
  const newSlugTouched = useRef(false);
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editParentId, setEditParentId] = useState("");

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

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c] as const)), [categories]);

  const editInvalidParentIds = useMemo(() => {
    if (!editId) return new Set<string>();
    return new Set([editId, ...collectDescendantIds(categories, editId)]);
  }, [categories, editId]);

  const editParentOptions = useMemo(
    () => categories.filter((c) => !editInvalidParentIds.has(c.id)),
    [categories, editInvalidParentIds],
  );

  const openEdit = (c: CategoryRow) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditParentId(c.parentId ?? "");
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Yeni kategori" description="Ad yazıldığında slug otomatik önerilir; isterseniz slug alanını kendiniz düzenleyin. Üst kategori seçmezseniz kök kategori oluşur.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
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
          <Field label="Üst kategori (opsiyonel)" className="lg:mb-0">
            <select
              className="input-soft"
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
            >
              <option value="">— Kök —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="button"
            disabled={busy || !catName.trim() || !catSlug.trim()}
            onClick={() => void createCategory()}
            className="btn-primary h-11 shrink-0 self-end disabled:opacity-50"
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5" title={c.parentId}>
                          {byId.get(c.parentId)?.name ?? "?"}
                        </span>
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
              <Field label="Üst kategori">
                <select
                  className="input-soft"
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                >
                  <option value="">— Kök —</option>
                  {editParentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                  void updateCategory(editId, {
                    name: editName,
                    slug: editSlug,
                    parentId: editParentId.trim() ? editParentId.trim() : null,
                  }).then(() => setEditId(null))
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
