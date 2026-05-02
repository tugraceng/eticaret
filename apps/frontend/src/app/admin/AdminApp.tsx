"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ComponentType } from "react";
import { ADMIN_TOKEN_KEY, AdminSessionTerminated } from "@/lib/platform-session";
import { adminFetch, adminUploadFile } from "./api";
import { DiscountsEditor } from "./DiscountsEditor";
import { HomeEditor } from "./HomeEditor";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { CategoriesPanel, CmsPanel, NotificationsPanel, OrdersPanel, ProductsPanel } from "./AdminTabPanels";
import { PaymentsEditor } from "./PaymentsEditor";
import { ReturnsModerator } from "./ReturnsModerator";
import { ReviewsModerator } from "./ReviewsModerator";
import { SettingsEditor } from "./SettingsEditor";
import { ShippingRatesEditor } from "./ShippingRatesEditor";
import { StockMovementsPanel } from "./StockMovementsPanel";
import { AdminTabGuide } from "./AdminTabGuide";
import { AdminCard, Icon, StatCard, StatusBadge, Toast } from "./ui";
import type { Tab } from "./tabs";

export type { Tab } from "./tabs";

const PATCHABLE_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type PatchableOrderStatus = (typeof PATCHABLE_ORDER_STATUSES)[number];

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  stock: number;
  isPublished: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  variants?: Array<{
    id: string;
    label: string;
    sku: string | null;
    priceCents: number | null;
    stock: number;
    trackStock: boolean;
    sortOrder: number;
    isActive: boolean;
  }>;
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

type AnalyticsRow = { event: string; _count: { _all: number } };

type SalesInsights = {
  days: number;
  daily: Array<{ date: string; revenueCents: number; orders: number }>;
  bestsellers: Array<{ productId: string; quantitySold: number; name: string; slug: string }>;
  crm: Array<{
    orderId: string;
    at: string;
    status: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    totalCents: number;
    currency: string;
  }>;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

type CategoryRow = { id: string; name: string; slug: string; _count?: { products: number } };

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  type: string;
  createdAt: string;
};

function priceFmt(cents: number, currency = "TRY") {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency });
}

export function AdminApp({ initialTab = "overview" }: { initialTab?: Tab }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const [token, setToken] = useState<string | null>(null);
  useLayoutEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      setToken(trimmed || null);
    } catch {
      setToken(null);
    }
  }, []);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderStatusPick, setOrderStatusPick] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [counters, setCounters] = useState<{
    pendingReviews: number;
    pendingReturns: number;
    lowStock: number;
    pendingOrders: number;
  }>({ pendingReviews: 0, pendingReturns: 0, lowStock: 0, pendingOrders: 0 });
  const [insights, setInsights] = useState<SalesInsights | null>(null);

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");

  const [blogSlug, setBlogSlug] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogBody, setBlogBody] = useState("");
  const [blogPublish, setBlogPublish] = useState(true);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [cmsTab, setCmsTab] = useState<"blog" | "services" | "projects" | "list">("blog");

  const [svcSlug, setSvcSlug] = useState("");
  const [svcTitle, setSvcTitle] = useState("");
  const [svcSummary, setSvcSummary] = useState("");
  const [svcDesc, setSvcDesc] = useState("");

  const [projSlug, setProjSlug] = useState("");
  const [projTitle, setProjTitle] = useState("");
  const [projSummary, setProjSummary] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projGallery, setProjGallery] = useState("");

  const [expandOrderId, setExpandOrderId] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPriceTry, setEditPriceTry] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [editCategoryId, setEditCategoryId] = useState("");

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPriceTry, setNewPriceTry] = useState("99.99");
  const [newStock, setNewStock] = useState("10");
  const [newCategoryId, setNewCategoryId] = useState("");

  const [imgAlt, setImgAlt] = useState("");

  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantPriceTry, setNewVariantPriceTry] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("0");
  const [newVariantTrackStock, setNewVariantTrackStock] = useState(true);
  const [newVariantActive, setNewVariantActive] = useState(true);

  const goTab = useCallback(
    (next: Tab) => {
      setTab(next);
      const target = next === "overview" ? "/admin" : `/admin/${next}`;
      if (pathname !== target) router.push(target);
    },
    [pathname, router],
  );

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const logout = useCallback(() => {
    setToken(null);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    router.push("/admin/login");
  }, [router]);

  const loadCounters = useCallback(async () => {
    if (!token) return;
    try {
      const c = (await adminFetch("/analytics/admin/counters", token)) as {
        pendingReviews: number;
        pendingReturns: number;
        lowStock: number;
        pendingOrders: number;
      };
      setCounters(c);
    } catch {
      // sayaçlar opsiyonel — sessizce yut
    }
  }, [token]);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      const [a, p, o, n] = await Promise.all([
        adminFetch("/analytics/summary", token) as Promise<AnalyticsRow[]>,
        adminFetch("/products/admin", token) as Promise<ProductRow[]>,
        adminFetch("/orders/admin", token) as Promise<OrderRow[]>,
        adminFetch("/notifications", token) as Promise<NotificationRow[]>,
      ]);
      setAnalytics(Array.isArray(a) ? a : []);
      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
      setNotifications(Array.isArray(n) ? n : []);
      try {
        const ins = (await adminFetch("/orders/admin/insights?days=30", token)) as SalesInsights;
        setInsights(ins && typeof ins === "object" && Array.isArray(ins.daily) ? ins : null);
      } catch {
        setInsights(null);
      }
      void loadCounters();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token, loadCounters]);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const p = (await adminFetch("/products/admin", token)) as ProductRow[];
      setProducts(Array.isArray(p) ? p : []);
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const o = (await adminFetch("/orders/admin", token)) as OrderRow[];
      setOrders(Array.isArray(o) ? o : []);
      setOrderStatusPick({});
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const c = (await adminFetch("/categories", token)) as CategoryRow[];
      setCategories(Array.isArray(c) ? c : []);
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const n = (await adminFetch("/notifications", token)) as NotificationRow[];
      setNotifications(Array.isArray(n) ? n : []);
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  const loadCmsPosts = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const list = (await adminFetch("/cms/blog/admin", token)) as BlogPostRow[];
      setBlogPosts(Array.isArray(list) ? list : []);
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (tab === "overview") void loadOverview();
    if (tab === "products") void loadProducts();
    if (tab === "orders") void loadOrders();
    if (tab === "cms") void loadCmsPosts();
    if (tab === "categories" || tab === "products") void loadCategories();
    if (tab === "notifications") void loadNotifications();
    void loadCounters();
  }, [
    token,
    tab,
    loadOverview,
    loadProducts,
    loadOrders,
    loadCmsPosts,
    loadCategories,
    loadNotifications,
    loadCounters,
  ]);

  const createProduct = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const priceCents = Math.round(parseFloat(newPriceTry.replace(",", ".")) * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error("Geçerli fiyat girin");
      await adminFetch("/products", token, {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          priceCents,
          stock: parseInt(newStock, 10) || 0,
          isPublished: true,
          ...(newCategoryId ? { categoryId: newCategoryId } : {}),
        }),
      });
      setNewName("");
      setNewSlug("");
      setNewCategoryId("");
      await loadProducts();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token, newName, newSlug, newPriceTry, newStock, newCategoryId, loadProducts]);

  const createCategory = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/categories", token, {
        method: "POST",
        body: JSON.stringify({ name: catName.trim(), slug: catSlug.trim().toLowerCase() }),
      });
      setCatName("");
      setCatSlug("");
      await loadCategories();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token, catName, catSlug, loadCategories]);

  const deleteCategory = useCallback(
    async (id: string, name: string) => {
      if (!token) return;
      if (!window.confirm(`Kategori "${name}" silinsin mi? (Ürünlerin kategorisi kaldırılır.)`))
        return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/categories/${id}`, token, { method: "DELETE" });
        await loadCategories();
        await loadProducts();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, loadCategories, loadProducts],
  );

  const addProductImageFromFile = useCallback(
    async (file: File) => {
      if (!token || !editingProductId) return;
      setBusy(true);
      setError(null);
      try {
        const { url } = await adminUploadFile(token, file);
        await adminFetch(`/products/${editingProductId}/images`, token, {
          method: "POST",
          body: JSON.stringify({ url, alt: imgAlt.trim() || undefined }),
        });
        await loadProducts();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, editingProductId, imgAlt, loadProducts],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await adminFetch(`/notifications/${id}/read`, token, { method: "PATCH" });
        await loadNotifications();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    },
    [token, loadNotifications],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!token) return;
    try {
      await adminFetch("/notifications/read-all", token, { method: "POST" });
      await loadNotifications();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }, [token, loadNotifications]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      if (!token) return;
      if (!PATCHABLE_ORDER_STATUSES.includes(status as PatchableOrderStatus)) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/orders/admin/${orderId}/status`, token, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        await loadOrders();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, loadOrders],
  );

  const saveBlogPost = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        slug: blogSlug.trim(),
        title: blogTitle.trim(),
        excerpt: blogExcerpt.trim() || undefined,
        body: blogBody,
        publish: blogPublish,
      };
      if (editingBlogId) {
        await adminFetch(`/cms/blog/${editingBlogId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/cms/blog", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingBlogId(null);
      setBlogSlug("");
      setBlogTitle("");
      setBlogExcerpt("");
      setBlogBody("");
      setBlogPublish(true);
      await loadCmsPosts();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token, blogSlug, blogTitle, blogExcerpt, blogBody, blogPublish, editingBlogId, loadCmsPosts]);

  const cancelBlogEdit = useCallback(() => {
    setEditingBlogId(null);
    setBlogSlug("");
    setBlogTitle("");
    setBlogExcerpt("");
    setBlogBody("");
    setBlogPublish(true);
  }, []);

  const openBlogEditor = useCallback(
    async (id: string) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        const p = (await adminFetch(`/cms/blog/admin/${id}`, token)) as {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string;
          publishedAt: string | null;
        };
        setEditingBlogId(p.id);
        setBlogSlug(p.slug);
        setBlogTitle(p.title);
        setBlogExcerpt(p.excerpt ?? "");
        setBlogBody(p.body);
        setBlogPublish(!!p.publishedAt);
        setCmsTab("blog");
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  const deleteBlogPost = useCallback(
    async (id: string, title: string) => {
      if (!token) return;
      if (!window.confirm(`"${title}" yazısı silinsin mi? Bu işlem geri alınamaz.`)) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/cms/blog/${id}`, token, { method: "DELETE" });
        if (editingBlogId === id) cancelBlogEdit();
        await loadCmsPosts();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, editingBlogId, cancelBlogEdit, loadCmsPosts],
  );

  const createService = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/cms/services", token, {
        method: "POST",
        body: JSON.stringify({
          slug: svcSlug.trim(),
          title: svcTitle.trim(),
          summary: svcSummary.trim() || undefined,
          description: svcDesc,
        }),
      });
      setSvcSlug("");
      setSvcTitle("");
      setSvcSummary("");
      setSvcDesc("");
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token, svcSlug, svcTitle, svcSummary, svcDesc]);

  const createProject = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const urls = projGallery
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      await adminFetch("/cms/projects", token, {
        method: "POST",
        body: JSON.stringify({
          slug: projSlug.trim(),
          title: projTitle.trim(),
          summary: projSummary.trim() || undefined,
          description: projDesc,
          gallery: urls.length ? urls : undefined,
        }),
      });
      setProjSlug("");
      setProjTitle("");
      setProjSummary("");
      setProjDesc("");
      setProjGallery("");
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [token, projSlug, projTitle, projSummary, projDesc, projGallery]);

  const openProductEdit = useCallback((p: ProductRow) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditSlug(p.slug);
    setEditPriceTry((p.priceCents / 100).toFixed(2).replace(".", ","));
    setEditStock(String(p.stock));
    setEditPublished(p.isPublished);
    setEditCategoryId(p.categoryId ?? "");
    setImgAlt("");
    setNewVariantLabel("");
    setNewVariantSku("");
    setNewVariantPriceTry("");
    setNewVariantStock("0");
    setNewVariantTrackStock(true);
    setNewVariantActive(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const saveProductEdit = useCallback(async () => {
    if (!token || !editingProductId) return;
    setBusy(true);
    setError(null);
    try {
      const priceCents = Math.round(parseFloat(editPriceTry.replace(",", ".")) * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error("Geçerli fiyat girin");
      await adminFetch(`/products/${editingProductId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          priceCents,
          stock: parseInt(editStock, 10) || 0,
          isPublished: editPublished,
          categoryId: editCategoryId || null,
        }),
      });
      setEditingProductId(null);
      await loadProducts();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [
    token,
    editingProductId,
    editName,
    editSlug,
    editPriceTry,
    editStock,
    editPublished,
    editCategoryId,
    loadProducts,
  ]);

  const deleteProduct = useCallback(
    async (id: string, name: string) => {
      if (!token) return;
      if (!window.confirm(`"${name}" silinsin mi?`)) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/products/${id}`, token, { method: "DELETE" });
        if (editingProductId === id) setEditingProductId(null);
        await loadProducts();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, loadProducts, editingProductId],
  );

  const addProductVariant = useCallback(async () => {
    if (!token || !editingProductId || !newVariantLabel.trim()) return;
    setBusy(true);
    setError(null);
    try {
      let priceCents: number | null | undefined;
      const pt = newVariantPriceTry.trim();
      if (pt === "") priceCents = undefined;
      else {
        const c = Math.round(parseFloat(pt.replace(",", ".")) * 100);
        if (!Number.isFinite(c) || c < 0) throw new Error("Geçerli fiyat girin veya boş bırakın");
        priceCents = c;
      }
      await adminFetch(`/products/${editingProductId}/variants`, token, {
        method: "POST",
        body: JSON.stringify({
          label: newVariantLabel.trim(),
          ...(newVariantSku.trim() ? { sku: newVariantSku.trim() } : {}),
          ...(priceCents !== undefined ? { priceCents } : {}),
          stock: parseInt(newVariantStock, 10) || 0,
          trackStock: newVariantTrackStock,
          isActive: newVariantActive,
        }),
      });
      setNewVariantLabel("");
      setNewVariantSku("");
      setNewVariantPriceTry("");
      setNewVariantStock("0");
      setNewVariantTrackStock(true);
      setNewVariantActive(true);
      await loadProducts();
    } catch (e) {
      if (!(e instanceof AdminSessionTerminated)) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [
    token,
    editingProductId,
    newVariantLabel,
    newVariantSku,
    newVariantPriceTry,
    newVariantStock,
    newVariantTrackStock,
    newVariantActive,
    loadProducts,
  ]);

  const updateProductVariant = useCallback(
    async (
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
    ) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/products/${productId}/variants/${variantId}`, token, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        await loadProducts();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, loadProducts],
  );

  const deleteProductVariant = useCallback(
    async (productId: string, variantId: string, label: string) => {
      if (!token) return;
      if (!window.confirm(`"${label}" seçeneği silinsin mi?`)) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/products/${productId}/variants/${variantId}`, token, {
          method: "DELETE",
        });
        await loadProducts();
      } catch (e) {
        if (!(e instanceof AdminSessionTerminated)) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setBusy(false);
      }
    },
    [token, loadProducts],
  );

  type NavItem = {
    id: Tab;
    label: string;
    /** Fare ile üzerine gelince tam açıklama */
    hint: string;
    icon: ComponentType<{ className?: string }>;
  };

  type NavGroup = { title: string; subtitle?: string; items: readonly NavItem[] };

  const navGroups = useMemo<readonly NavGroup[]>(
    () => [
      {
        title: "Özet ve mağaza",
        subtitle: "Sayfa başı istatistikler ve genel ayarlar",
        items: [
          {
            id: "overview",
            label: "Özet ekranı",
            hint: "Ciro, son siparişler, grafikler ve hızlı kısayollar",
            icon: Icon.Dashboard,
          },
          {
            id: "settings",
            label: "Mağaza bilgileri",
            hint: "Site adı, logo, renkler, iletişim ve teknik ayarlar",
            icon: Icon.Settings,
          },
          {
            id: "notifications",
            label: "Bildirimler",
            hint: "Sistem uyarıları — okundu işaretleyebilirsiniz",
            icon: Icon.Bell,
          },
        ],
      },
      {
        title: "Ürün ve stok",
        subtitle: "Satılacak ürünleri ve grupları yönetin",
        items: [
          {
            id: "categories",
            label: "Kategoriler",
            hint: "Ürün grupları (ör. anahtarlık, dekor). Önce kategori, sonra ürün ekleyin",
            icon: Icon.Folder,
          },
          {
            id: "products",
            label: "Ürünler",
            hint: "Yeni ürün, fiyat, stok, fotoğraf ve varyantlar",
            icon: Icon.Box,
          },
          {
            id: "stock",
            label: "Stok geçmişi",
            hint: "Stok artış/azalış kayıtları — envanter kontrolü",
            icon: Icon.Layers,
          },
        ],
      },
      {
        title: "Sayfa içerikleri",
        subtitle: "Müşterinin gördüğü metin ve düzen",
        items: [
          {
            id: "home",
            label: "Ana sayfa vitrini",
            hint: "Slaytlar ve blok sırası — sitenin ilk ekranı",
            icon: Icon.Home,
          },
          {
            id: "cms",
            label: "Blog ve ek sayfalar",
            hint: "Blog yazısı, hizmet sayfası, proje portföyü",
            icon: Icon.Doc,
          },
        ],
      },
      {
        title: "Sipariş ve müşteri",
        subtitle: "Sipariş akışı ve geri bildirim",
        items: [
          {
            id: "orders",
            label: "Siparişler",
            hint: "Durum güncelleme, kalem listesi, detay",
            icon: Icon.Bag,
          },
          {
            id: "returns",
            label: "İade talepleri",
            hint: "Müşteri iade isteklerini işleyin",
            icon: Icon.Undo,
          },
          {
            id: "reviews",
            label: "Yorumlar",
            hint: "Ürün yorumlarını onaylayın veya reddedin",
            icon: Icon.Eye,
          },
        ],
      },
      {
        title: "Ödeme ve kargo",
        subtitle: "Fiyat kuralları ve teslimat",
        items: [
          {
            id: "discounts",
            label: "İndirim kodları",
            hint: "Kupon oluşturma — yüzde veya sabit indirim",
            icon: Icon.Tag,
          },
          {
            id: "payments",
            label: "Ödeme (iyzico)",
            hint: "Ödeme entegrasyonu — dikkatli kullanın",
            icon: Icon.Card,
          },
          {
            id: "shipping",
            label: "Kargo fiyatları",
            hint: "Sepet tutarına göre kargo ücreti tablosu",
            icon: Icon.Truck,
          },
        ],
      },
    ],
    [],
  );

  const flatNav = useMemo(() => navGroups.flatMap((g) => [...g.items]), [navGroups]);
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const currentNav = flatNav.find((n) => n.id === tab);

  const sidebar = (
    <nav className="flex flex-1 flex-col overflow-y-auto p-3">
      {navGroups.map((group) => (
        <div key={group.title} className="mt-5 first:mt-0">
          <p className="mb-0.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {group.title}
          </p>
          {group.subtitle ? (
            <p className="mb-2 px-3 text-[10px] leading-snug text-slate-500/80">{group.subtitle}</p>
          ) : null}
          <div className="flex flex-col gap-1">
            {group.items.map((n) => {
              const IconC = n.icon;
              const active = tab === n.id;
              const badge =
                n.id === "notifications" && unreadNotifs > 0
                  ? unreadNotifs
                  : n.id === "reviews" && counters.pendingReviews > 0
                    ? counters.pendingReviews
                    : n.id === "returns" && counters.pendingReturns > 0
                      ? counters.pendingReturns
                      : n.id === "stock" && counters.lowStock > 0
                        ? counters.lowStock
                        : null;
              return (
                <Link
                  key={n.id}
                  href={n.id === "overview" ? "/admin" : `/admin/${n.id}`}
                  title={n.hint}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth ${
                    active
                      ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-400"
                      aria-hidden
                    />
                  )}
                  <IconC className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-left">{n.label}</span>
                  {badge !== null && (
                    <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-900/50 bg-slate-950 text-slate-200 md:flex">
        <div className="border-b border-white/5 px-5 py-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg"
            >
              <Icon.Dashboard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Yönetim
              </p>
              <p className="text-sm font-semibold text-white">Mağaza paneli</p>
              <p className="mt-1 max-w-[11rem] text-[10px] leading-snug text-slate-500">
                Soldan bölüm seçin. Menü öğesinin üzerine gelince kısa açıklama görünür.
              </p>
            </div>
          </div>
        </div>
        {sidebar}
        <div className="border-t border-white/5 p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <span aria-hidden>←</span> Siteye dön
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 flex-col bg-slate-950 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                  <Icon.Dashboard className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-white">Mağaza paneli</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Kapat"
              >
                <Icon.X />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Menü"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Yönetim paneli
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                {currentNav?.label ?? "Yönetim"}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => goTab("notifications")}
              className="relative grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100"
              aria-label="Bildirimler"
            >
              <Icon.Bell />
              {unreadNotifs > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadNotifs}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
            >
              <Icon.Logout />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-6 overflow-auto p-4 sm:p-8">
          {error && <Toast kind="error">{error}</Toast>}
          <AdminTabGuide tab={tab} />

          {tab === "overview" ? (
            <OverviewTab
              analytics={analytics}
              products={products}
              orders={orders}
              notifications={notifications}
              insights={insights}
              busy={busy}
            />
          ) : null}

          {token && tab === "home" ? <HomeEditor token={token} /> : null}

          {token && tab === "settings" ? <SettingsEditor token={token} /> : null}

          {token && tab === "payments" ? <PaymentsEditor token={token} /> : null}

          {token && tab === "shipping" ? <ShippingRatesEditor token={token} /> : null}

          {token && tab === "reviews" ? <ReviewsModerator token={token} /> : null}

          {token && tab === "returns" ? <ReturnsModerator token={token} /> : null}

          {token && tab === "stock" ? <StockMovementsPanel token={token} /> : null}

          {token && tab === "discounts" ? <DiscountsEditor token={token} /> : null}

          {token && tab === "categories" ? (
            <CategoriesPanel
              busy={busy}
              categories={categories}
              catName={catName}
              catSlug={catSlug}
              setCatName={setCatName}
              setCatSlug={setCatSlug}
              createCategory={createCategory}
              deleteCategory={deleteCategory}
            />
          ) : null}

          {token && tab === "notifications" ? (
            <NotificationsPanel
              notifications={notifications}
              unreadNotifs={unreadNotifs}
              markAllNotificationsRead={markAllNotificationsRead}
              markNotificationRead={markNotificationRead}
            />
          ) : null}

          {token && tab === "products" ? (
            <ProductsPanel
              busy={busy}
              categories={categories}
              newName={newName}
              newSlug={newSlug}
              newPriceTry={newPriceTry}
              newStock={newStock}
              newCategoryId={newCategoryId}
              setNewName={setNewName}
              setNewSlug={setNewSlug}
              setNewPriceTry={setNewPriceTry}
              setNewStock={setNewStock}
              setNewCategoryId={setNewCategoryId}
              createProduct={createProduct}
              editingProductId={editingProductId}
              editName={editName}
              editSlug={editSlug}
              editPriceTry={editPriceTry}
              editStock={editStock}
              editPublished={editPublished}
              editCategoryId={editCategoryId}
              imgAlt={imgAlt}
              setEditName={setEditName}
              setEditSlug={setEditSlug}
              setEditPriceTry={setEditPriceTry}
              setEditStock={setEditStock}
              setEditPublished={setEditPublished}
              setEditCategoryId={setEditCategoryId}
              setImgAlt={setImgAlt}
              addProductImageFromFile={addProductImageFromFile}
              saveProductEdit={saveProductEdit}
              setEditingProductId={setEditingProductId}
              products={products}
              openProductEdit={openProductEdit}
              deleteProduct={deleteProduct}
              priceFmt={priceFmt}
              newVariantLabel={newVariantLabel}
              setNewVariantLabel={setNewVariantLabel}
              newVariantSku={newVariantSku}
              setNewVariantSku={setNewVariantSku}
              newVariantPriceTry={newVariantPriceTry}
              setNewVariantPriceTry={setNewVariantPriceTry}
              newVariantStock={newVariantStock}
              setNewVariantStock={setNewVariantStock}
              newVariantTrackStock={newVariantTrackStock}
              setNewVariantTrackStock={setNewVariantTrackStock}
              newVariantActive={newVariantActive}
              setNewVariantActive={setNewVariantActive}
              addProductVariant={addProductVariant}
              updateProductVariant={updateProductVariant}
              deleteProductVariant={deleteProductVariant}
            />
          ) : null}

          {token && tab === "cms" ? (
            <CmsPanel
              token={token}
              busy={busy}
              cmsTab={cmsTab}
              setCmsTab={setCmsTab}
              editingBlogId={editingBlogId}
              blogSlug={blogSlug}
              blogTitle={blogTitle}
              blogExcerpt={blogExcerpt}
              blogBody={blogBody}
              blogPublish={blogPublish}
              setBlogSlug={setBlogSlug}
              setBlogTitle={setBlogTitle}
              setBlogExcerpt={setBlogExcerpt}
              setBlogBody={setBlogBody}
              setBlogPublish={setBlogPublish}
              saveBlogPost={saveBlogPost}
              cancelBlogEdit={cancelBlogEdit}
              openBlogEditor={openBlogEditor}
              deleteBlogPost={deleteBlogPost}
              svcSlug={svcSlug}
              svcTitle={svcTitle}
              svcSummary={svcSummary}
              svcDesc={svcDesc}
              setSvcSlug={setSvcSlug}
              setSvcTitle={setSvcTitle}
              setSvcSummary={setSvcSummary}
              setSvcDesc={setSvcDesc}
              createService={createService}
              projSlug={projSlug}
              projTitle={projTitle}
              projSummary={projSummary}
              projDesc={projDesc}
              projGallery={projGallery}
              setProjSlug={setProjSlug}
              setProjTitle={setProjTitle}
              setProjSummary={setProjSummary}
              setProjDesc={setProjDesc}
              setProjGallery={setProjGallery}
              createProject={createProject}
              blogPosts={blogPosts}
            />
          ) : null}

          {token && tab === "orders" ? (
            <OrdersPanel
              orders={orders}
              orderStatusPick={orderStatusPick}
              setOrderStatusPick={setOrderStatusPick}
              busy={busy}
              expandOrderId={expandOrderId}
              setExpandOrderId={setExpandOrderId}
              setDetailOrderId={setDetailOrderId}
              updateOrderStatus={updateOrderStatus}
              priceFmt={priceFmt}
            />
          ) : null}
        </main>
      </div>
      {detailOrderId && token && (
        <OrderDetailPanel
          orderId={detailOrderId}
          token={token}
          onClose={() => setDetailOrderId(null)}
          onUpdated={() => void loadOrders()}
        />
      )}
    </div>
  );
}

function OverviewTab({
  analytics,
  products,
  orders,
  notifications,
  insights,
  busy,
}: {
  analytics: AnalyticsRow[];
  products: ProductRow[];
  orders: OrderRow[];
  notifications: NotificationRow[];
  insights: SalesInsights | null;
  busy: boolean;
}) {
  const revenue = orders.reduce((s, o) => s + (o.totalCents || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const publishedProducts = products.filter((p) => p.isPublished).length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const recent = [...orders].slice(0, 5);

  const quickLinks = [
    { href: "/admin/categories", label: "Kategoriler", hint: "Ürün grupları", icon: Icon.Folder },
    { href: "/admin/products", label: "Ürünler", hint: "Ekle veya düzenle", icon: Icon.Box },
    { href: "/admin/orders", label: "Siparişler", hint: "Durum güncelle", icon: Icon.Bag },
    { href: "/admin/home", label: "Ana sayfa", hint: "Vitrin ve slaytlar", icon: Icon.Home },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminCard title="Sık kullanılanlar" description="En çok ihtiyaç duyacağınız sayfalar — doğrudan açılır.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q) => {
            const Ic = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                title={q.hint}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-sky-100 group-hover:text-sky-900">
                  <Ic className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">{q.label}</span>
                  <span className="block text-xs text-slate-500">{q.hint}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam ciro"
          value={(revenue / 100).toLocaleString("tr-TR", {
            style: "currency",
            currency: orders[0]?.currency ?? "TRY",
            maximumFractionDigits: 0,
          })}
          hint={`${orders.length} sipariş`}
          icon={<Icon.Bag />}
          tone="emerald"
        />
        <StatCard
          label="Bekleyen sipariş"
          value={pendingOrders}
          hint="İşleme alınmayı bekliyor"
          icon={<Icon.Bell />}
          tone="amber"
        />
        <StatCard
          label="Yayında ürün"
          value={publishedProducts}
          hint={`${products.length - publishedProducts} taslak`}
          icon={<Icon.Box />}
          tone="sky"
        />
        <StatCard
          label="Okunmamış bildirim"
          value={unreadNotifs}
          hint={`${notifications.length} toplam`}
          icon={<Icon.Bell />}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <AdminCard title="Son siparişler" description={busy ? "Yükleniyor…" : `${recent.length} kayıt`}>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Sipariş yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-slate-400">#{o.id.slice(0, 10)}…</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                      {o.guestEmail ?? "Misafir"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(o.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={o.status} />
                    <p className="text-sm font-semibold text-slate-900">
                      {(o.totalCents / 100).toLocaleString("tr-TR", {
                        style: "currency",
                        currency: o.currency,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="Son 30 gün — olaylar" description="Vitrinden gelen analytics olayları">
          {analytics.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Veri yok veya vitrin henüz olay göndermedi.
            </p>
          ) : (
            <ul className="space-y-2">
              {analytics.map((row) => {
                const max = Math.max(...analytics.map((r) => r._count._all));
                const pct = max > 0 ? (row._count._all / max) * 100 : 0;
                return (
                  <li key={row.event}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-mono text-xs text-slate-700">{row.event}</span>
                      <span className="font-semibold text-slate-900">{row._count._all}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-700 ease-smooth"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>

      {insights && insights.daily.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <AdminCard
            title={`Günlük ciro — son ${Math.min(14, insights.daily.length)} gün`}
            description={`İptal hariç siparişler · ${insights.days} günlük pencere`}
          >
            {(() => {
              const last = insights.daily.slice(-14);
              const maxRev = Math.max(1, ...last.map((d) => d.revenueCents));
              const maxPx = 160;
              return (
                <div className="flex h-44 items-end gap-1.5 border-b border-slate-100 pb-1">
                  {last.map((d) => {
                    const px = Math.round((d.revenueCents / maxRev) * maxPx);
                    return (
                      <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full min-w-[4px] rounded-t-md bg-gradient-to-t from-sky-600 to-indigo-400 transition-all"
                          style={{ height: `${Math.max(d.revenueCents > 0 ? 6 : 0, px)}px` }}
                          title={`${d.date}: ${(d.revenueCents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} · ${d.orders} sip.`}
                        />
                        <span className="text-[9px] text-slate-400">{d.date.slice(8)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </AdminCard>

          <AdminCard title="En çok satan ürünler" description="Satılan adet (sipariş kalemi)">
            {insights.bestsellers.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Bu dönemde veri yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {insights.bestsellers.map((b) => (
                  <li key={b.productId} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      {b.slug ? (
                        <Link
                          href={`/shop/${b.slug}`}
                          className="truncate text-sm font-semibold text-slate-800 hover:underline"
                          target="_blank"
                        >
                          {b.name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-slate-800">{b.name}</p>
                      )}
                      <p className="text-[11px] text-slate-500">{b.quantitySold} adet</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      ) : null}

      {insights && insights.crm.length > 0 ? (
        <AdminCard title="Son müşteri etkileşimleri" description="CRM özeti — ödeme ve teslimat durumları">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Tarih</th>
                  <th className="pb-2 font-medium">Durum</th>
                  <th className="pb-2 font-medium">İletişim</th>
                  <th className="pb-2 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {insights.crm.slice(0, 12).map((r) => (
                  <tr key={r.orderId} className="border-b border-slate-50">
                    <td className="py-2.5 text-xs text-slate-600">
                      {new Date(r.at).toLocaleString("tr-TR")}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5">
                      <p className="truncate text-xs font-medium text-slate-800">{r.email ?? "—"}</p>
                      <p className="truncate text-[11px] text-slate-500">{r.name ?? r.phone ?? ""}</p>
                    </td>
                    <td className="py-2.5 text-right text-xs font-semibold text-slate-900">
                      {(r.totalCents / 100).toLocaleString("tr-TR", {
                        style: "currency",
                        currency: r.currency,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ) : null}
    </div>
  );
}
