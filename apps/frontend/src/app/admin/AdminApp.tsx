"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ADMIN_TOKEN_KEY, AdminSessionTerminated } from "@/lib/platform-session";
import { adminFetch, adminUploadFile } from "./api";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { CategoriesPanel, CmsPanel, NotificationsPanel, OrdersPanel, ProductsPanel } from "./AdminTabPanels";
import { ADMIN_NAV_GROUPS } from "./config/nav";
import { AdminMobileMenu } from "./components/layout/AdminMobileMenu";
import {
  AdminDesktopSidebarShell,
  AdminSidebarBrand,
  AdminSidebarFooter,
  AdminTopbar,
} from "./components/layout/AdminTopbar";
import { AdminSidebar } from "./components/layout/AdminSidebar";
import { AdminSearchCommand } from "./components/layout/AdminSearchCommand";
import { AdminTabLayout } from "./components/layout/AdminTabLayout";
import { PATCHABLE_ORDER_STATUSES, type PatchableOrderStatus } from "./constants/orders";
import { OverviewPanel } from "./panels/OverviewPanel";
import { HomePanel } from "./panels/HomePanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { PaymentsPanel } from "./panels/PaymentsPanel";
import { ShippingPanel } from "./panels/ShippingPanel";
import { ReviewsPanel } from "./panels/ReviewsPanel";
import { ReturnsPanel } from "./panels/ReturnsPanel";
import { StockPanel } from "./panels/StockPanel";
import { DiscountsPanel } from "./panels/DiscountsPanel";
import { formatCentsAsTryInput, parseTryToCentsOptional } from "./utils/money";
import type {
  AnalyticsRow,
  BlogPostRow,
  CategoryRow,
  NotificationRow,
  OrderRow,
  ProductRow,
  SalesInsights,
} from "./types";
import type { Tab } from "./tabs";

export type { Tab } from "./tabs";

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
  const [searchOpen, setSearchOpen] = useState(false);

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

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [editDescription, setEditDescription] = useState("");
  const [editCompareAtTry, setEditCompareAtTry] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editTrackStock, setEditTrackStock] = useState(true);

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

  useEffect(() => {
    if (!successToast) return;
    const t = window.setTimeout(() => setSuccessToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [successToast]);

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

  const toggleProductPublish = useCallback(
    async (productId: string, next: boolean) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/products/${productId}`, token, {
          method: "PATCH",
          body: JSON.stringify({ isPublished: next }),
        });
        await loadProducts();
        setSuccessToast(next ? "Ürün yayına alındı." : "Ürün yayından kaldırıldı.");
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
      if (!window.confirm(
        `Kategori "${name}" silinsin mi?\n\nBu kategoriye bağlı ürünler varsa, ürünlerin kategorisi kaldırılır (ürünler silinmez).`,
      ))
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

  const updateCategory = useCallback(
    async (id: string, payload: { name: string; slug: string }) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/categories/${id}`, token, {
          method: "PATCH",
          body: JSON.stringify({
            name: payload.name.trim(),
            slug: payload.slug.trim().toLowerCase(),
          }),
        });
        await loadCategories();
        await loadProducts();
        setSuccessToast("Kategori güncellendi.");
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

  const adjustProductStock = useCallback(
    async (productId: string, delta: number, note?: string) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/products/admin/${productId}/adjust-stock`, token, {
          method: "POST",
          body: JSON.stringify({ delta, note: note?.trim() || undefined }),
        });
        await loadProducts();
        setSuccessToast("Stok güncellendi.");
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
    setEditDescription(p.description ?? "");
    setEditPriceTry((p.priceCents / 100).toFixed(2).replace(".", ","));
    setEditCompareAtTry(
      typeof p.compareAtCents === "number" ? formatCentsAsTryInput(p.compareAtCents) : "",
    );
    setEditSku(p.sku ?? "");
    setEditTrackStock(p.trackStock ?? true);
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
      const compareParsed = parseTryToCentsOptional(editCompareAtTry);
      if (!compareParsed.ok) throw new Error(compareParsed.message);
      const st = parseInt(editStock, 10);
      if (!Number.isFinite(st) || st < 0) throw new Error("Stok miktarı negatif olamaz.");
      await adminFetch(`/products/${editingProductId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          description: editDescription.trim() || null,
          priceCents,
          compareAtCents: compareParsed.cents,
          sku: editSku.trim() || null,
          trackStock: editTrackStock,
          stock: st,
          isPublished: editPublished,
          categoryId: editCategoryId || null,
        }),
      });
      setEditingProductId(null);
      await loadProducts();
      setSuccessToast("Ürün güncellendi.");
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
    editDescription,
    editPriceTry,
    editCompareAtTry,
    editSku,
    editTrackStock,
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

  const bulkUnpublishProducts = useCallback(
    async (ids: string[]) => {
      if (!token || ids.length === 0) return;
      setBusy(true);
      setError(null);
      try {
        for (const id of ids) {
          await adminFetch(`/products/${id}`, token, {
            method: "PATCH",
            body: JSON.stringify({ isPublished: false }),
          });
        }
        await loadProducts();
        setSuccessToast(`${ids.length} ürün yayından kaldırıldı.`);
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

  const bulkDeleteProducts = useCallback(
    async (ids: string[]) => {
      if (!token || ids.length === 0) return;
      setBusy(true);
      setError(null);
      try {
        for (const id of ids) {
          await adminFetch(`/products/${id}`, token, { method: "DELETE" });
        }
        setEditingProductId(null);
        await loadProducts();
        setSuccessToast(`${ids.length} ürün silindi.`);
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

  const flatNav = useMemo(() => ADMIN_NAV_GROUPS.flatMap((g) => [...g.items]), []);
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const currentNav = flatNav.find((n) => n.id === tab);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AdminSearchCommand groups={ADMIN_NAV_GROUPS} open={searchOpen} onOpenChange={setSearchOpen} />

      <AdminDesktopSidebarShell>
        <AdminSidebarBrand />
        <AdminSidebar
          groups={ADMIN_NAV_GROUPS}
          activeTab={tab}
          counters={counters}
          unreadNotifs={unreadNotifs}
        />
        <AdminSidebarFooter />
      </AdminDesktopSidebarShell>

      <AdminMobileMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        groups={ADMIN_NAV_GROUPS}
        activeTab={tab}
        counters={counters}
        unreadNotifs={unreadNotifs}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={currentNav?.label ?? "Yönetim"}
          onOpenMobileMenu={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          unreadNotifs={unreadNotifs}
          onNotifications={() => goTab("notifications")}
          onLogout={() => logout()}
          onGoProducts={() => goTab("products")}
          onGoCategories={() => goTab("categories")}
          onGoOrders={() => goTab("orders")}
        />

        <AdminTabLayout tab={tab} error={error} successToast={successToast}>
          {tab === "overview" ? (
            <OverviewPanel
              analytics={analytics}
              products={products}
              orders={orders}
              notifications={notifications}
              insights={insights}
              busy={busy}
              counters={counters}
            />
          ) : null}

          {token && tab === "home" ? <HomePanel token={token} /> : null}

          {token && tab === "settings" ? <SettingsPanel token={token} /> : null}

          {token && tab === "payments" ? <PaymentsPanel token={token} /> : null}

          {token && tab === "shipping" ? <ShippingPanel token={token} /> : null}

          {token && tab === "reviews" ? <ReviewsPanel token={token} /> : null}

          {token && tab === "returns" ? <ReturnsPanel token={token} /> : null}

          {token && tab === "stock" ? <StockPanel token={token} /> : null}

          {token && tab === "discounts" ? <DiscountsPanel token={token} /> : null}

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
              updateCategory={updateCategory}
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
              token={token}
              busy={busy}
              categories={categories}
              editingProductId={editingProductId}
              editName={editName}
              editSlug={editSlug}
              editDescription={editDescription}
              editPriceTry={editPriceTry}
              editCompareAtTry={editCompareAtTry}
              editSku={editSku}
              editTrackStock={editTrackStock}
              editStock={editStock}
              editPublished={editPublished}
              editCategoryId={editCategoryId}
              imgAlt={imgAlt}
              setEditName={setEditName}
              setEditSlug={setEditSlug}
              setEditDescription={setEditDescription}
              setEditPriceTry={setEditPriceTry}
              setEditCompareAtTry={setEditCompareAtTry}
              setEditSku={setEditSku}
              setEditTrackStock={setEditTrackStock}
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
              toggleProductPublish={toggleProductPublish}
              adjustProductStock={adjustProductStock}
              onWizardSuccess={setSuccessToast}
              onWizardError={setError}
              onProductsReload={() => void loadProducts()}
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
              bulkUnpublishProducts={bulkUnpublishProducts}
              bulkDeleteProducts={bulkDeleteProducts}
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
        </AdminTabLayout>
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
