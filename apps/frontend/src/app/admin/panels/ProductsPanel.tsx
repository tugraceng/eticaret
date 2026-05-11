"use client";

import { apiUrl } from "@/lib/api";
import { adminFetch } from "../api";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ProductFormWizard } from "../components/forms/ProductFormWizard";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ProductVariantRow } from "./ProductVariantRow";
import { AdminCard, Field, Icon } from "../ui";
import type { CategoryRow, ProductRow } from "../types";

export function ProductsPanel({
  token,
  busy,
  categories,
  editingProductId,
  editName,
  editSlug,
  editDescription,
  editPriceTry,
  editCompareAtTry,
  editSku,
  editTrackStock,
  editShowPublicStockCount,
  editStock,
  editPublished,
  editCategoryId,
  editMetaTitle,
  editMetaDescription,
  editSeoKeywords,
  editFeatured,
  editNew,
  imgAlt,
  setEditName,
  setEditSlug,
  setEditDescription,
  setEditPriceTry,
  setEditCompareAtTry,
  setEditSku,
  setEditTrackStock,
  setEditShowPublicStockCount,
  setEditStock,
  setEditPublished,
  setEditCategoryId,
  setEditMetaTitle,
  setEditMetaDescription,
  setEditSeoKeywords,
  setEditFeatured,
  setEditNew,
  setImgAlt,
  addProductImageFromFile,
  saveProductEdit,
  setEditingProductId,
  products,
  openProductEdit,
  deleteProduct,
  toggleProductPublish,
  adjustProductStock,
  onWizardSuccess,
  onWizardError,
  onProductsReload,
  priceFmt,
  newVariantLabel,
  setNewVariantLabel,
  newVariantSku,
  setNewVariantSku,
  newVariantPriceTry,
  setNewVariantPriceTry,
  newVariantStock,
  setNewVariantStock,
  newVariantTrackStock,
  setNewVariantTrackStock,
  newVariantActive,
  setNewVariantActive,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  bulkUnpublishProducts,
  bulkDeleteProducts,
}: {
  token: string;
  busy: boolean;
  categories: CategoryRow[];
  editingProductId: string | null;
  editName: string;
  editSlug: string;
  editDescription: string;
  editPriceTry: string;
  editCompareAtTry: string;
  editSku: string;
  editTrackStock: boolean;
  editShowPublicStockCount: boolean;
  editStock: string;
  editPublished: boolean;
  editCategoryId: string;
  editMetaTitle: string;
  editMetaDescription: string;
  editSeoKeywords: string;
  editFeatured: boolean;
  editNew: boolean;
  imgAlt: string;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditSlug: Dispatch<SetStateAction<string>>;
  setEditDescription: Dispatch<SetStateAction<string>>;
  setEditPriceTry: Dispatch<SetStateAction<string>>;
  setEditCompareAtTry: Dispatch<SetStateAction<string>>;
  setEditSku: Dispatch<SetStateAction<string>>;
  setEditTrackStock: Dispatch<SetStateAction<boolean>>;
  setEditShowPublicStockCount: Dispatch<SetStateAction<boolean>>;
  setEditStock: Dispatch<SetStateAction<string>>;
  setEditPublished: Dispatch<SetStateAction<boolean>>;
  setEditCategoryId: Dispatch<SetStateAction<string>>;
  setEditMetaTitle: Dispatch<SetStateAction<string>>;
  setEditMetaDescription: Dispatch<SetStateAction<string>>;
  setEditSeoKeywords: Dispatch<SetStateAction<string>>;
  setEditFeatured: Dispatch<SetStateAction<boolean>>;
  setEditNew: Dispatch<SetStateAction<boolean>>;
  setImgAlt: Dispatch<SetStateAction<string>>;
  addProductImageFromFile: (file: File) => Promise<void>;
  saveProductEdit: () => Promise<void>;
  setEditingProductId: Dispatch<SetStateAction<string | null>>;
  products: ProductRow[];
  openProductEdit: (product: ProductRow) => void;
  deleteProduct: (id: string, name: string) => Promise<void>;
  toggleProductPublish: (id: string, next: boolean) => Promise<void>;
  adjustProductStock: (productId: string, delta: number, note?: string) => Promise<void>;
  onWizardSuccess: (message: string) => void;
  onWizardError: (message: string) => void;
  onProductsReload: () => void;
  priceFmt: (cents: number, currency?: string) => string;
  newVariantLabel: string;
  setNewVariantLabel: Dispatch<SetStateAction<string>>;
  newVariantSku: string;
  setNewVariantSku: Dispatch<SetStateAction<string>>;
  newVariantPriceTry: string;
  setNewVariantPriceTry: Dispatch<SetStateAction<string>>;
  newVariantStock: string;
  setNewVariantStock: Dispatch<SetStateAction<string>>;
  newVariantTrackStock: boolean;
  setNewVariantTrackStock: Dispatch<SetStateAction<boolean>>;
  newVariantActive: boolean;
  setNewVariantActive: Dispatch<SetStateAction<boolean>>;
  addProductVariant: () => Promise<void>;
  updateProductVariant: (
    productId: string,
    variantId: string,
    body: {
      label: string;
      sku: string | null;
      priceCents: number | null;
      stock: number;
      trackStock: boolean;
      isActive: boolean;
    },
  ) => Promise<void>;
  deleteProductVariant: (productId: string, variantId: string, label: string) => Promise<void>;
  bulkUnpublishProducts: (ids: string[]) => Promise<void>;
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
}) {
  const productImgFileRef = useRef<HTMLInputElement>(null);
  const editingProduct = editingProductId ? products.find((p) => p.id === editingProductId) : null;
  const variantBasePriceCents = editingProduct?.priceCents ?? 0;

  const [productQ, setProductQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [pubFilter, setPubFilter] = useState<"all" | "published" | "draft">("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [lowTh, setLowTh] = useState(5);
  const [stockModal, setStockModal] = useState<{ id: string; name: string } | null>(null);
  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const j = (await adminFetch("/settings/admin", token)) as { lowStockThreshold?: number };
        if (typeof j.lowStockThreshold === "number") setLowTh(j.lowStockThreshold);
      } catch {
        try {
          const r = await fetch(apiUrl("/settings"));
          if (!r.ok) return;
          const j = (await r.json()) as { lowStockThreshold?: number };
          if (typeof j.lowStockThreshold === "number") setLowTh(j.lowStockThreshold);
        } catch {
          /* ignore */
        }
      }
    })();
  }, [token]);

  const filteredProducts = useMemo(() => {
    let list = products;
    const q = productQ.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    if (catFilter) list = list.filter((p) => p.categoryId === catFilter);
    if (pubFilter === "published") list = list.filter((p) => p.isPublished);
    if (pubFilter === "draft") list = list.filter((p) => !p.isPublished);
    if (stockFilter === "in") list = list.filter((p) => !p.trackStock || p.stock > 0);
    if (stockFilter === "out") list = list.filter((p) => p.trackStock && p.stock <= 0);
    if (stockFilter === "low")
      list = list.filter((p) => p.trackStock && p.stock > 0 && p.stock <= lowTh);
    return list;
  }, [products, productQ, catFilter, pubFilter, stockFilter, lowTh]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const ids = new Set(filteredProducts.map((p) => p.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next;
    });
  }, [filteredProducts]);

  const selectedInView = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)),
    [filteredProducts, selectedIds],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllInFilter = () => {
    setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <>
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Seçili ürünleri sil"
        description={
          selectedInView.length > 0
            ? `${selectedInView.length} ürün kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`
            : ""
        }
        danger
        confirmLabel="Evet, sil"
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          setBulkDeleteOpen(false);
          void bulkDeleteProducts(selectedInView.map((p) => p.id)).then(() => clearSelection());
        }}
      />

    <div className="space-y-6">
      <ProductFormWizard
        token={token}
        categories={categories}
        onSuccess={onWizardSuccess}
        onError={onWizardError}
        onFinished={onProductsReload}
      />

      {editingProductId && (
        <AdminCard
          tone="warning"
          title={
            <span className="inline-flex items-center gap-2 text-amber-900">
              <Icon.Pencil /> Ürünü düzenle
            </span>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Ad">
              <input className="input-soft" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </Field>
            <Field label="Slug">
              <input className="input-soft font-mono text-sm" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
            </Field>
            <Field label="Satış fiyatı (TRY)">
              <input
                className="input-soft"
                value={editPriceTry}
                onChange={(e) => setEditPriceTry(e.target.value)}
              />
            </Field>
            <Field label="İndirim öncesi fiyat" hint="Boş bırakılabilir.">
              <input
                className="input-soft"
                value={editCompareAtTry}
                onChange={(e) => setEditCompareAtTry(e.target.value)}
                placeholder="Örn. 299,00"
              />
            </Field>
            <Field label="Stok">
              <input
                className="input-soft"
                type="number"
                min={0}
                value={editStock}
                onChange={(e) => setEditStock(e.target.value.replace(/[^\d]/g, ""))}
              />
            </Field>
            <Field label="SKU">
              <input className="input-soft font-mono text-sm" value={editSku} onChange={(e) => setEditSku(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Açıklama">
              <textarea
                className="input-soft min-h-[88px] resize-y"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Ürün sayfasında görünen açıklama"
              />
            </Field>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Kategori">
              <select
                className="input-soft"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
              >
                <option value="">— Yok —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editPublished}
                onChange={(e) => setEditPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Yayında
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={editTrackStock}
                onChange={(e) => setEditTrackStock(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Stok takibi (satışta stok düşsün)
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={editShowPublicStockCount}
                onChange={(e) => setEditShowPublicStockCount(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
              />
              <span>
                Mağazada stok <strong className="font-semibold text-slate-800">adedini</strong> göster
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Kapalıyken müşteri yalnızca “Stokta” / “Stokta yok” görür; düşük stok uyarısı ve varyant adetleri gizlenir.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SEO ve rozetler</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Meta başlık">
                <input className="input-soft" value={editMetaTitle} onChange={(e) => setEditMetaTitle(e.target.value)} maxLength={200} />
              </Field>
              <Field label="Anahtar kelimeler" hint="Virgülle ayırın">
                <input className="input-soft" value={editSeoKeywords} onChange={(e) => setEditSeoKeywords(e.target.value)} maxLength={4000} />
              </Field>
            </div>
            <Field label="Meta açıklama">
              <textarea
                className="input-soft min-h-[72px] resize-y"
                value={editMetaDescription}
                onChange={(e) => setEditMetaDescription(e.target.value)}
                maxLength={8000}
              />
            </Field>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editFeatured} onChange={(e) => setEditFeatured(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Öne çıkan
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editNew} onChange={(e) => setEditNew(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Yeni ürün
              </label>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-white/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">Görsel ekle</p>
            <p className="mt-1 text-xs text-slate-500">
              Dosya API&apos;ye yüklenir; adres otomatik ürüne eklenir (en fazla ~6 MB, JPG/PNG/WebP/GIF/SVG/ICO).
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <input
                ref={productImgFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.ico,image/x-icon,image/vnd.microsoft.icon"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void addProductImageFromFile(f);
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => productImgFileRef.current?.click()}
                className="btn-ghost disabled:opacity-50"
              >
                <Icon.Plus /> Dosya seç ve ekle
              </button>
              <div className="min-w-[200px] flex-1">
                <Field label="Alt metin (isteğe bağlı)">
                  <input
                    placeholder="Erişilebilirlik için kısa açıklama"
                    className="input-soft"
                    value={imgAlt}
                    onChange={(e) => setImgAlt(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-700">
              Ürün seçenekleri (varyantlar)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Boş bırakılan fiyat, ürünün taban fiyatını kullanır. Seçenekli ürünlerde stok genelde varyant
              satırlarındadır.
            </p>
            <div className="mt-3 space-y-2">
              {(editingProduct?.variants ?? []).length === 0 ? (
                <p className="rounded-lg bg-slate-50 py-3 text-center text-xs text-slate-500">
                  Henüz seçenek yok.
                </p>
              ) : (
                (editingProduct?.variants ?? []).map((v) => (
                  <ProductVariantRow
                    key={v.id}
                    basePriceCents={variantBasePriceCents}
                    variant={v}
                    busy={busy}
                    priceFmt={priceFmt}
                    onUpdate={(variantId, body) =>
                      updateProductVariant(editingProductId!, variantId, body)
                    }
                    onDelete={(variantId, label) =>
                      deleteProductVariant(editingProductId!, variantId, label)
                    }
                  />
                ))
              )}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Yeni seçenek</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Etiket">
                  <input
                    className="input-soft text-xs"
                    placeholder="örn. Mat Siyah"
                    value={newVariantLabel}
                    onChange={(e) => setNewVariantLabel(e.target.value)}
                  />
                </Field>
                <Field label="SKU">
                  <input
                    className="input-soft text-xs"
                    value={newVariantSku}
                    onChange={(e) => setNewVariantSku(e.target.value)}
                  />
                </Field>
                <Field label={`Fiyat (boş = ${priceFmt(variantBasePriceCents)})`}>
                  <input
                    className="input-soft text-xs"
                    placeholder="varsayılan"
                    value={newVariantPriceTry}
                    onChange={(e) => setNewVariantPriceTry(e.target.value)}
                  />
                </Field>
                <Field label="Stok">
                  <input
                    className="input-soft text-xs"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newVariantTrackStock}
                    onChange={(e) => setNewVariantTrackStock(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  Stok takip
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newVariantActive}
                    onChange={(e) => setNewVariantActive(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  Aktif
                </label>
                <button
                  type="button"
                  disabled={busy || !newVariantLabel.trim() || !editingProductId}
                  onClick={() => void addProductVariant()}
                  className="btn-ghost !py-1.5 !px-3 text-xs disabled:opacity-40"
                >
                  <Icon.Plus /> Seçenek ekle
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveProductEdit()}
              className="btn-primary disabled:opacity-50"
            >
              <Icon.Check /> Kaydet
            </button>
            <button type="button" onClick={() => setEditingProductId(null)} className="btn-ghost">
              İptal
            </button>
          </div>
        </AdminCard>
      )}

      <AdminCard
        title="Ürün listesi"
        description={`${products.length} ürün · ${filteredProducts.length} filtreye uyan`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === "table" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              onClick={() => setViewMode("table")}
            >
              Tablo
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === "cards" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              onClick={() => setViewMode("cards")}
            >
              Kart
            </button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Ürün veya slug ara…"
            className="input-soft min-w-[200px] flex-1"
            value={productQ}
            onChange={(e) => setProductQ(e.target.value)}
          />
          <select className="input-soft w-full sm:w-44" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">Tüm kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="input-soft w-full sm:w-40"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as "all" | "in" | "low" | "out")}
          >
            <option value="all">Tüm stoklar</option>
            <option value="in">Stokta var</option>
            <option value="low">Stok az (≤{lowTh})</option>
            <option value="out">Stok yok</option>
          </select>
          <select
            className="input-soft w-full sm:w-40"
            value={pubFilter}
            onChange={(e) => setPubFilter(e.target.value as "all" | "published" | "draft")}
          >
            <option value="all">Tüm yayınlar</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
          </select>
        </div>

        {selectedInView.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm">
            <span className="font-semibold text-sky-950">{selectedInView.length} seçili</span>
            <button
              type="button"
              className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
              onClick={() =>
                void bulkUnpublishProducts(selectedInView.filter((p) => p.isPublished).map((p) => p.id)).then(() =>
                  clearSelection(),
                )
              }
              disabled={busy || !selectedInView.some((p) => p.isPublished)}
            >
              Seçilenleri yayından kaldır
            </button>
            <button
              type="button"
              className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
              disabled={busy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Seçilenleri sil
            </button>
            <button type="button" className="text-xs font-semibold text-slate-600 hover:underline" onClick={clearSelection}>
              Seçimi temizle
            </button>
            <button type="button" className="text-xs font-semibold text-slate-600 hover:underline" onClick={selectAllInFilter}>
              Filtredeki tümünü seç
            </button>
          </div>
        ) : null}

        {products.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Henüz ürün yok.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Filtreye uygun ürün yok.</p>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="w-10 px-2 py-2">
                    <input
                      type="checkbox"
                      aria-label="Filtredeki tümünü seç"
                      checked={
                        filteredProducts.length > 0 &&
                        filteredProducts.every((p) => selectedIds.has(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) selectAllInFilter();
                        else clearSelection();
                      }}
                    />
                  </th>
                  <th className="px-2 py-2">Varyant</th>
                  <th className="px-2 py-2">Ad</th>
                  <th className="px-2 py-2">Fiyat</th>
                  <th className="px-2 py-2">Stok</th>
                  <th className="px-2 py-2">Yayın</th>
                  <th className="px-2 py-2">Kategori</th>
                  <th className="px-2 py-2 text-right">Hızlı işlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Seç: ${p.name}`}
                      />
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {(p.variants?.length ?? 0) > 0 ? (
                        <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-800">
                          {p.variants!.length}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[200px] px-2 py-3">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{p.slug}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="font-medium">{priceFmt(p.priceCents)}</span>
                      {typeof p.compareAtCents === "number" ? (
                        <span className="ml-1 text-xs text-rose-600 line-through">{priceFmt(p.compareAtCents)}</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex h-2 w-2 rounded-full ${p.trackStock === false || p.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                        aria-hidden
                      />
                      <span className="ml-2">{p.stock}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          p.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.isPublished ? "Yayında" : "Taslak"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">{p.category?.name ?? "—"}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openProductEdit(p)}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-50"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleProductPublish(p.id, !p.isPublished)}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-50"
                        >
                          {p.isPublished ? "Kaldır" : "Yayınla"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openProductEdit(p);
                            window.setTimeout(() => productImgFileRef.current?.click(), 100);
                          }}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50"
                        >
                          Görsel
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockModal({ id: p.id, name: p.name })}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                        >
                          Stok
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProduct(p.id, p.name)}
                          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <label className="absolute left-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-slate-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                </label>
                <div className="relative aspect-[4/3] bg-slate-100">
                  {p.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl text-slate-300">📦</div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.isPublished ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                    }`}
                  >
                    {p.isPublished ? "Yayında" : "Taslak"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 font-semibold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{priceFmt(p.priceCents)}</p>
                  <p className="text-xs text-slate-500">Stok: {p.stock}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <button type="button" className="btn-ghost !py-1 !px-2 text-xs" onClick={() => openProductEdit(p)}>
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !py-1 !px-2 text-xs"
                      onClick={() => void toggleProductPublish(p.id, !p.isPublished)}
                    >
                      {p.isPublished ? "Kaldır" : "Yayınla"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !py-1 !px-2 text-xs"
                      onClick={() => setStockModal({ id: p.id, name: p.name })}
                    >
                      Stok
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {stockModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Stok güncelle</h3>
            <p className="mt-1 text-sm text-slate-600">{stockModal.name}</p>
            <div className="mt-4 space-y-3">
              <Field label="Miktar (+ ekler, − düşürür)" hint="Örn. +10 veya -2">
                <input
                  className="input-soft font-mono"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  placeholder="+5"
                />
              </Field>
              <Field label="Açıklama şablonu">
                <select
                  className="input-soft"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                >
                  <option value="">Seçin (isteğe bağlı)</option>
                  <option value="Yeni ürün girişi">Yeni ürün girişi</option>
                  <option value="Hasarlı ürün">Hasarlı ürün</option>
                  <option value="Manuel düzeltme">Manuel düzeltme</option>
                  <option value="İade">İade</option>
                </select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setStockModal(null)}>
                Vazgeç
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => {
                  const d = parseInt(stockDelta.trim(), 10);
                  if (!Number.isFinite(d) || d === 0) return;
                  const note = stockReason ? `${stockReason}` : undefined;
                  void adjustProductStock(stockModal.id, d, note).then(() => {
                    setStockModal(null);
                    setStockDelta("");
                    setStockReason("");
                  });
                }}
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </>
  );
}
