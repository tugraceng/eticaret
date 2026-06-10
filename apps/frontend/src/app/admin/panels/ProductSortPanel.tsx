"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "../api";
import { formatAdminCaughtError } from "../admin-api-error";
import { AdminCard, Icon } from "../ui";
import type { ProductRow } from "../types";

type SortMode = "catalog" | "featured";

export function ProductSortPanel({
  token,
  products,
  onReload,
}: {
  token: string;
  products: ProductRow[];
  onReload: () => void;
}) {
  const [mode, setMode] = useState<SortMode>("catalog");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const source = useMemo(() => {
    const list = mode === "featured" ? products.filter((p) => p.isFeatured) : products;
    return [...list].sort((a, b) => {
      const key = mode === "featured" ? "featuredSortOrder" : "sortOrder";
      const av = (a as ProductRow & { sortOrder?: number; featuredSortOrder?: number })[key] ?? 0;
      const bv = (b as ProductRow & { sortOrder?: number; featuredSortOrder?: number })[key] ?? 0;
      if (av !== bv) return av - bv;
      return a.name.localeCompare(b.name, "tr");
    });
  }, [products, mode]);

  useEffect(() => {
    setItems(source);
  }, [source]);

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = items.findIndex((p) => p.id === dragId);
    const to = items.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
  };

  const saveOrder = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const payload = items.map((p, idx) => ({
        id: p.id,
        ...(mode === "featured" ? { featuredSortOrder: idx } : { sortOrder: idx }),
      }));
      await adminFetch("/products/admin/reorder", token, {
        method: "PATCH",
        body: JSON.stringify({ items: payload }),
      });
      setSaved(true);
      onReload();
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(formatAdminCaughtError(e, "Sıralama kaydedilemedi") ?? "Sıralama kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }, [items, mode, onReload, token]);

  return (
    <AdminCard
      title="Ürün sıralama"
      description="Mağaza listesi ve öne çıkan vitrin sırasını sürükleyerek yönetin."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "catalog" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setMode("catalog")}
          >
            Mağaza sırası
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "featured" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            onClick={() => setMode("featured")}
          >
            Öne çıkan sırası
          </button>
        </div>
      }
    >
      {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
      {saved ? <p className="mb-3 text-sm font-semibold text-emerald-700">Sıralama kaydedildi.</p> : null}

      {mode === "featured" && items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Öne çıkan işaretli ürün yok. Ürün düzenlemeden «Öne çıkan» seçin.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((p, idx) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(p.id)}
              className={`flex cursor-grab items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100 active:cursor-grabbing ${
                dragId === p.id ? "opacity-50" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
              <span className="text-slate-400" aria-hidden>
                ⋮⋮
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                <p className="truncate text-xs text-slate-500">{p.slug}</p>
              </div>
              {!p.isPublished ? (
                <span className="shrink-0 text-[10px] font-bold uppercase text-amber-700">Taslak</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={busy || items.length === 0}
        onClick={() => void saveOrder()}
        className="btn-primary mt-4 disabled:opacity-50"
      >
        <Icon.Check /> Sıralamayı kaydet
      </button>
    </AdminCard>
  );
}
