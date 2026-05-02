"use client";

import { apiUrl } from "@/lib/api";
import { Fragment, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ProductFormWizard } from "./components/forms/ProductFormWizard";
import { slugifyTr } from "./utils/slug";
import { formatAdminCaughtError } from "./admin-api-error";
import { adminUploadFile } from "./api";
import { AdminCard, Field, Icon, StatusBadge } from "./ui";

const PATCHABLE_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type PatchableOrderStatus = (typeof PATCHABLE_ORDER_STATUSES)[number];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  _count?: { products: number };
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  type: string;
  createdAt: string;
};

type OrderItemRow = {
  quantity: number;
  titleSnapshot: string;
  unitPriceCents: number;
  variantLabelSnapshot?: string | null;
};

type OrderRow = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  guestEmail?: string | null;
  items?: OrderItemRow[];
};

type AdminProductVariant = {
  id: string;
  label: string;
  sku: string | null;
  priceCents: number | null;
  stock: number;
  trackStock: boolean;
  sortOrder: number;
  isActive: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceCents: number;
  compareAtCents?: number | null;
  sku?: string | null;
  trackStock?: boolean;
  stock: number;
  isPublished: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<{ id: string; url: string; alt?: string | null; sortOrder: number }>;
  variants?: AdminProductVariant[];
};

function ProductVariantRow({
  basePriceCents,
  variant,
  busy,
  priceFmt,
  onUpdate,
  onDelete,
}: {
  basePriceCents: number;
  variant: AdminProductVariant;
  busy: boolean;
  priceFmt: (cents: number, currency?: string) => string;
  onUpdate: (
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
  onDelete: (variantId: string, label: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(variant.label);
  const [sku, setSku] = useState(variant.sku ?? "");
  const [priceTry, setPriceTry] = useState(
    variant.priceCents != null ? (variant.priceCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [stock, setStock] = useState(String(variant.stock));
  const [trackStock, setTrackStock] = useState(variant.trackStock);
  const [isActive, setIsActive] = useState(variant.isActive);

  useEffect(() => {
    setLabel(variant.label);
    setSku(variant.sku ?? "");
    setPriceTry(
      variant.priceCents != null ? (variant.priceCents / 100).toFixed(2).replace(".", ",") : "",
    );
    setStock(String(variant.stock));
    setTrackStock(variant.trackStock);
    setIsActive(variant.isActive);
  }, [variant]);

  const save = async () => {
    let priceCents: number | null;
    const pt = priceTry.trim();
    if (pt === "") priceCents = null;
    else {
      const c = Math.round(parseFloat(pt.replace(",", ".")) * 100);
      if (!Number.isFinite(c) || c < 0) return;
      priceCents = c;
    }
    await onUpdate(variant.id, {
      label: label.trim(),
      sku: sku.trim() || null,
      priceCents,
      stock: parseInt(stock, 10) || 0,
      trackStock,
      isActive,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Etiket">
          <input className="input-soft text-xs" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="SKU">
          <input className="input-soft text-xs" value={sku} onChange={(e) => setSku(e.target.value)} />
        </Field>
        <Field label={`Fiyat (boş = ${priceFmt(basePriceCents)})`}>
          <input
            className="input-soft text-xs"
            placeholder="varsayılan"
            value={priceTry}
            onChange={(e) => setPriceTry(e.target.value)}
          />
        </Field>
        <Field label="Stok">
          <input className="input-soft text-xs" value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
        <label className="mt-6 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={trackStock}
            onChange={(e) => setTrackStock(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Stok takip
        </label>
        <label className="mt-6 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Aktif
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !label.trim()}
          onClick={() => void save()}
          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Kaydet
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete(variant.id, variant.label)}
          className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
        >
          Sil
        </button>
      </div>
    </div>
  );
}

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

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

export function NotificationsPanel({
  notifications,
  unreadNotifs,
  markAllNotificationsRead,
  markNotificationRead,
}: {
  notifications: NotificationRow[];
  unreadNotifs: number;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}) {
  return (
    <AdminCard
      title="Bildirimler"
      description={`${unreadNotifs} okunmamış`}
      actions={
        <button
          type="button"
          onClick={() => void markAllNotificationsRead()}
          className="btn-ghost !py-2 !px-3 text-xs"
        >
          <Icon.Check /> Tümünü okundu işaretle
        </button>
      }
    >
      {notifications.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Bildirim yok.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex flex-wrap items-start justify-between gap-3 py-4 ${n.read ? "opacity-60" : ""}`}
            >
              <div className="flex gap-3">
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body && <p className="mt-1 text-xs text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {n.type} · {new Date(n.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => void markNotificationRead(n.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                >
                  Okundu
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}

export function OrdersPanel({
  orders,
  orderStatusPick,
  setOrderStatusPick,
  busy,
  expandOrderId,
  setExpandOrderId,
  setDetailOrderId,
  updateOrderStatus,
  priceFmt,
}: {
  orders: OrderRow[];
  orderStatusPick: Record<string, string>;
  setOrderStatusPick: Dispatch<SetStateAction<Record<string, string>>>;
  busy: boolean;
  expandOrderId: string | null;
  setExpandOrderId: Dispatch<SetStateAction<string | null>>;
  setDetailOrderId: Dispatch<SetStateAction<string | null>>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  priceFmt: (cents: number, currency?: string) => string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const visible = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <AdminCard
      title="Siparişler"
      description={`${orders.length} kayıt${statusFilter !== "all" ? ` · ${visible.length} gösteriliyor` : ""}`}
      actions={
        <select
          className="input-soft !py-2 !text-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tüm durumlar</option>
          {Object.keys(ORDER_STATUS_LABELS).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      }
    >
      {orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Henüz sipariş yok.</p>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Bu duruma ait sipariş yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">E-posta</th>
                <th className="px-2 py-2">Durum</th>
                <th className="px-2 py-2">Güncelle</th>
                <th className="px-2 py-2">Tutar</th>
                <th className="px-2 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((o) => {
                const allStatuses = ["PENDING", ...PATCHABLE_ORDER_STATUSES] as const;
                const selected = orderStatusPick[o.id] ?? o.status;
                const canSave =
                  PATCHABLE_ORDER_STATUSES.includes(selected as PatchableOrderStatus) &&
                  selected !== o.status;
                return (
                  <Fragment key={o.id}>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-2 py-3 font-mono text-xs text-slate-500">{o.id.slice(0, 10)}…</td>
                      <td className="max-w-[160px] truncate px-2 py-3 text-xs text-slate-600">
                        {o.guestEmail ?? "—"}
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                            value={selected}
                            onChange={(e) =>
                              setOrderStatusPick((prev) => ({
                                ...prev,
                                [o.id]: e.target.value,
                              }))
                            }
                          >
                            {allStatuses.map((s) => (
                              <option key={s} value={s} disabled={s === "PENDING" && o.status !== "PENDING"}>
                                {ORDER_STATUS_LABELS[s] ?? s}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={busy || !canSave}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Sipariş durumu "${ORDER_STATUS_LABELS[selected] ?? selected}" olarak kaydedilecek. Onaylıyor musunuz?`,
                                )
                              )
                                return;
                              void updateOrderStatus(o.id, selected);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                          >
                            <Icon.Check /> Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandOrderId((id) => (id === o.id ? null : o.id))}
                            className="text-xs font-semibold text-sky-800 hover:underline"
                          >
                            {expandOrderId === o.id ? "Gizle" : "Kalemler"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailOrderId(o.id)}
                            className="text-xs font-semibold text-slate-700 hover:underline"
                          >
                            Detay
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-3 font-semibold text-slate-900">
                        {priceFmt(o.totalCents, o.currency)}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                    {expandOrderId === o.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Kalemler
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {(o.items ?? []).length === 0 && (
                              <li className="text-xs text-slate-500">Kalem yok.</li>
                            )}
                            {(o.items ?? []).map((it, idx) => (
                              <li
                                key={idx}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-slate-100"
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800">{it.titleSnapshot}</span>
                                  {it.variantLabelSnapshot ? (
                                    <span className="mt-0.5 block text-[11px] font-medium text-violet-700">
                                      Seçenek: {it.variantLabelSnapshot}
                                    </span>
                                  ) : null}
                                </div>
                                <span className="shrink-0 text-slate-500">
                                  ×{it.quantity} @ {priceFmt(it.unitPriceCents, o.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}

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
  editStock,
  editPublished,
  editCategoryId,
  imgAlt,
  setEditName,
  setEditSlug,
  setEditDescription,
  setEditPriceTry,
  setEditCompareAtTry,
  setEditSku,
  setEditTrackStock,
  setEditStock,
  setEditPublished,
  setEditCategoryId,
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
  editStock: string;
  editPublished: boolean;
  editCategoryId: string;
  imgAlt: string;
  setEditName: Dispatch<SetStateAction<string>>;
  setEditSlug: Dispatch<SetStateAction<string>>;
  setEditDescription: Dispatch<SetStateAction<string>>;
  setEditPriceTry: Dispatch<SetStateAction<string>>;
  setEditCompareAtTry: Dispatch<SetStateAction<string>>;
  setEditSku: Dispatch<SetStateAction<string>>;
  setEditTrackStock: Dispatch<SetStateAction<boolean>>;
  setEditStock: Dispatch<SetStateAction<string>>;
  setEditPublished: Dispatch<SetStateAction<boolean>>;
  setEditCategoryId: Dispatch<SetStateAction<string>>;
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

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(apiUrl("/settings"));
        if (!r.ok) return;
        const j = (await r.json()) as { lowStockThreshold?: number };
        if (typeof j.lowStockThreshold === "number") setLowTh(j.lowStockThreshold);
      } catch {
        /* ignore */
      }
    })();
  }, []);

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

  return (
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

        {products.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Henüz ürün yok.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Filtreye uygun ürün yok.</p>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
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
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
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
  );
}

export function CmsPanel({
  token,
  busy,
  cmsTab,
  setCmsTab,
  editingBlogId,
  blogSlug,
  blogTitle,
  blogExcerpt,
  blogBody,
  blogPublish,
  setBlogSlug,
  setBlogTitle,
  setBlogExcerpt,
  setBlogBody,
  setBlogPublish,
  saveBlogPost,
  cancelBlogEdit,
  openBlogEditor,
  deleteBlogPost,
  svcSlug,
  svcTitle,
  svcSummary,
  svcDesc,
  setSvcSlug,
  setSvcTitle,
  setSvcSummary,
  setSvcDesc,
  createService,
  projSlug,
  projTitle,
  projSummary,
  projDesc,
  projGallery,
  setProjSlug,
  setProjTitle,
  setProjSummary,
  setProjDesc,
  setProjGallery,
  createProject,
  blogPosts,
}: {
  token: string;
  busy: boolean;
  cmsTab: "blog" | "services" | "projects" | "list";
  setCmsTab: Dispatch<SetStateAction<"blog" | "services" | "projects" | "list">>;
  editingBlogId: string | null;
  blogSlug: string;
  blogTitle: string;
  blogExcerpt: string;
  blogBody: string;
  blogPublish: boolean;
  setBlogSlug: Dispatch<SetStateAction<string>>;
  setBlogTitle: Dispatch<SetStateAction<string>>;
  setBlogExcerpt: Dispatch<SetStateAction<string>>;
  setBlogBody: Dispatch<SetStateAction<string>>;
  setBlogPublish: Dispatch<SetStateAction<boolean>>;
  saveBlogPost: () => Promise<void>;
  cancelBlogEdit: () => void;
  openBlogEditor: (id: string) => Promise<void>;
  deleteBlogPost: (id: string, title: string) => Promise<void>;
  svcSlug: string;
  svcTitle: string;
  svcSummary: string;
  svcDesc: string;
  setSvcSlug: Dispatch<SetStateAction<string>>;
  setSvcTitle: Dispatch<SetStateAction<string>>;
  setSvcSummary: Dispatch<SetStateAction<string>>;
  setSvcDesc: Dispatch<SetStateAction<string>>;
  createService: () => Promise<void>;
  projSlug: string;
  projTitle: string;
  projSummary: string;
  projDesc: string;
  projGallery: string;
  setProjSlug: Dispatch<SetStateAction<string>>;
  setProjTitle: Dispatch<SetStateAction<string>>;
  setProjSummary: Dispatch<SetStateAction<string>>;
  setProjDesc: Dispatch<SetStateAction<string>>;
  setProjGallery: Dispatch<SetStateAction<string>>;
  createProject: () => Promise<void>;
  blogPosts: BlogPostRow[];
}) {
  const projGalFileRef = useRef<HTMLInputElement>(null);

  const tabBtn = (id: typeof cmsTab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setCmsTab(id)}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        cmsTab === id
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Ne eklemek istiyorsunuz?</p>
        <p className="mt-1 text-xs text-slate-500">
          Önce türü seçin; aşağıda yalnızca o form görünür. Blog listesini görmek için son sekmeye geçin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabBtn("blog", "Blog yazısı")}
          {tabBtn("services", "Hizmet sayfası")}
          {tabBtn("projects", "Proje / portföy")}
          {tabBtn("list", "Kayıtlı blog yazıları")}
        </div>
      </div>

      {cmsTab === "blog" ? (
      <AdminCard
        title={editingBlogId ? "Blog yazısını düzenle" : "Yeni blog yazısı"}
        description={
          editingBlogId
            ? "Değişiklikleri kaydedin veya iptal ile yeni yazı formuna dönün."
            : "Adres çubuğunda görünecek kısa slug (ör. yeni-sezon) ve içerik. SEO için başlık ve özet doldurun."
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug" hint="Küçük harf, tire ile kelimeler (ör. yeni-sezon)">
            <input className="input-soft" value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} />
          </Field>
          <Field label="Başlık">
            <input className="input-soft" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Özet" className="mt-3">
          <input
            className="input-soft"
            value={blogExcerpt}
            onChange={(e) => setBlogExcerpt(e.target.value)}
            placeholder="İsteğe bağlı kısa özet"
          />
        </Field>
        <Field label="İçerik" className="mt-3">
          <textarea
            className="input-soft resize-y"
            rows={6}
            value={blogBody}
            onChange={(e) => setBlogBody(e.target.value)}
            placeholder="Markdown veya düz metin"
          />
        </Field>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={blogPublish}
            onChange={(e) => setBlogPublish(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Yayında (işaretli değilse taslak kalır)
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !blogSlug.trim() || !blogTitle.trim() || !blogBody.trim()}
            onClick={() => void saveBlogPost()}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Check /> {editingBlogId ? "Değişiklikleri kaydet" : "Yazıyı kaydet"}
          </button>
          {editingBlogId ? (
            <button type="button" disabled={busy} onClick={cancelBlogEdit} className="btn-ghost disabled:opacity-50">
              İptal — yeni yazı
            </button>
          ) : null}
        </div>
      </AdminCard>
      ) : null}

      {cmsTab === "services" ? (
      <AdminCard title="Yeni hizmet sayfası" description="Sitedeki /hizmetler bölümünde listelenir; slug kısa ve benzersiz olsun.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug">
            <input className="input-soft" value={svcSlug} onChange={(e) => setSvcSlug(e.target.value)} />
          </Field>
          <Field label="Başlık">
            <input className="input-soft" value={svcTitle} onChange={(e) => setSvcTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Özet" className="mt-3">
          <input className="input-soft" value={svcSummary} onChange={(e) => setSvcSummary(e.target.value)} />
        </Field>
        <Field label="Açıklama" className="mt-3">
          <textarea
            className="input-soft resize-y"
            rows={5}
            value={svcDesc}
            onChange={(e) => setSvcDesc(e.target.value)}
          />
        </Field>
        <div className="mt-4">
          <button
            type="button"
            disabled={busy || !svcSlug.trim() || !svcTitle.trim() || !svcDesc.trim()}
            onClick={() => void createService()}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Plus /> Hizmeti oluştur
          </button>
        </div>
      </AdminCard>
      ) : null}

      {cmsTab === "projects" ? (
      <AdminCard
        title="Yeni proje"
        description="Galeri için görsel adreslerini satır satır yazın veya dosya yükleyerek URL ekleyin."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug">
            <input className="input-soft" value={projSlug} onChange={(e) => setProjSlug(e.target.value)} />
          </Field>
          <Field label="Başlık">
            <input className="input-soft" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Özet" className="mt-3">
          <input className="input-soft" value={projSummary} onChange={(e) => setProjSummary(e.target.value)} />
        </Field>
        <Field label="Açıklama" className="mt-3">
          <textarea
            className="input-soft resize-y"
            rows={5}
            value={projDesc}
            onChange={(e) => setProjDesc(e.target.value)}
          />
        </Field>
        <Field label="Galeri URL'leri" className="mt-3">
          <textarea
            className="input-soft resize-y font-mono text-xs"
            rows={3}
            value={projGallery}
            onChange={(e) => setProjGallery(e.target.value)}
            placeholder="Her satıra bir görsel adresi (yüklenen dosyalar otomatik eklenir)"
          />
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={projGalFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.ico,image/x-icon,image/vnd.microsoft.icon"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              void (async () => {
                try {
                  const { url } = await adminUploadFile(token, f);
                  setProjGallery((g) => (g.trim() ? `${g.trim()}\n` : "") + url);
                } catch (err) {
                  const msg = formatAdminCaughtError(err, "Yükleme başarısız");
                  if (msg) window.alert(msg);
                }
              })();
            }}
          />
          <button
            type="button"
            onClick={() => projGalFileRef.current?.click()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Görsel yükle (listeye ekle)
          </button>
        </div>
        <div className="mt-4">
          <button
            type="button"
            disabled={busy || !projSlug.trim() || !projTitle.trim() || !projDesc.trim()}
            onClick={() => void createProject()}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Plus /> Projeyi oluştur
          </button>
        </div>
      </AdminCard>
      ) : null}

      {cmsTab === "list" ? (
      <AdminCard title="Kayıtlı blog yazıları" description={`${blogPosts.length} yazı — düzenlemek veya silmek için satırdaki düğmeleri kullanın.`}>
        {blogPosts.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">Kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {blogPosts.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-900">{p.title}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{p.slug}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.publishedAt ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.publishedAt ? "Yayında" : "Taslak"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void openBlogEditor(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Icon.Pencil className="h-3.5 w-3.5" /> Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteBlogPost(p.id, p.title)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Icon.Trash className="h-3.5 w-3.5" /> Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      ) : null}
    </div>
  );
}
