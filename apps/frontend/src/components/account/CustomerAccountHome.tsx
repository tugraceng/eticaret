"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import {
  CUSTOMER_EMAIL_KEY,
  CUSTOMER_TOKEN_KEY,
  CustomerSessionTerminated,
  redirectCustomerToLogin,
} from "@/lib/platform-session";
import { AccountDashboardSidebar } from "@/components/account/AccountDashboardSidebar";
import { CustomerReturns } from "@/components/account/CustomerReturns";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { showSiteToast } from "@/lib/site-toast";
import { isAccountTabId, type AccountTabId } from "@/components/account/account-tab-ids";

type OrderRow = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { titleSnapshot: string; quantity: number }[];
};

type AddressRow = {
  id: string;
  label?: string | null;
  contactName?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  district?: string | null;
  city: string;
  postalCode?: string | null;
  country?: string | null;
  isDefault: boolean;
};

type MeData = {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  birthDate: string | null;
  marketingOptIn: boolean;
  customer?: { id: string; addresses: AddressRow[] } | null;
};

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

function orderStatusLabel(status: string) {
  const m: Record<string, string> = {
    PENDING: "Beklemede",
    PAID: "Ödendi",
    PROCESSING: "Hazırlanıyor",
    SHIPPED: "Kargoda",
    DELIVERED: "Teslim edildi",
    CANCELLED: "İptal",
  };
  return m[status] ?? status;
}

function priceFmt(cents: number, currency = "TRY") {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency });
}

async function authFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = formatApiErrorPayload(text || "{}", res.status);
    if (res.status === 401) redirectCustomerToLogin();
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}

export function CustomerAccountHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<"loading" | "ok">("loading");
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<AccountTabId>("overview");
  const [me, setMe] = useState<MeData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    const tok = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!tok) {
      router.replace("/hesap/giris");
      return;
    }
    setToken(tok);
    let cancel = false;
    void (async () => {
      try {
        const [meData, orderData] = await Promise.all([
          authFetch(tok, "/customers/me") as Promise<MeData>,
          authFetch(tok, "/orders/me") as Promise<OrderRow[]>,
        ]);
        if (cancel) return;
        setMe(meData);
        setOrders(Array.isArray(orderData) ? orderData : []);
      } catch (e) {
        if (e instanceof CustomerSessionTerminated) return;
        if (!cancel) setLoadErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel) setPhase("ok");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [router]);

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw && isAccountTabId(raw)) setTab(raw);
    else if (!raw) setTab("overview");
  }, [searchParams]);

  const selectTab = useCallback(
    (id: AccountTabId) => {
      setTab(id);
      router.replace(`/hesap?tab=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router],
  );

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const data = (await authFetch(token, "/customers/me")) as MeData;
    setMe(data);
  }, [token]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_EMAIL_KEY);
    router.replace("/hesap/giris");
  }, [router]);

  if (phase !== "ok") {
    return (
      <div className="bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            <div className="h-64 w-52 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-80 flex-1 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  const fullName =
    [me?.name, me?.surname].filter(Boolean).join(" ").trim() || me?.email || "Hesabım";
  const greetName = (me?.name || me?.surname || fullName).split(" ")[0] ?? fullName;

  return (
    <div className="bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {loadErr && (
          <pre className="mb-6 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
            {loadErr}
          </pre>
        )}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <AccountDashboardSidebar active={tab} onSelect={selectTab} onLogout={logout} />

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Hesabım</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Merhaba, {greetName}
                </h1>
                <p className="mt-1 text-sm text-slate-600">Siparişlerinizi ve bilgilerinizi buradan yönetin.</p>
                <p className="mt-0.5 text-xs text-slate-500">{me?.email}</p>
              </div>
              <Link href="/shop" className="btn-ghost ring-1 ring-slate-200/80">
                Alışverişe devam
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
              {tab === "overview" && <OverviewTab orders={orders} me={me} onGoto={selectTab} />}
              {tab === "orders" && <OrdersTab token={token!} orders={orders} onChange={setOrders} />}
              {tab === "returns" && (
                <div>
                  <CustomerReturns variant="embedded" authToken={token!} />
                  <p className="mt-4 text-center text-xs text-slate-500">
                    Tam sayfa:{" "}
                    <Link href="/hesap/iadeler" className="font-semibold text-sky-800 hover:underline">
                      İadeler
                    </Link>
                  </p>
                </div>
              )}
              {tab === "addresses" && <AddressesTab token={token!} me={me} onRefresh={refreshMe} />}
              {tab === "profile" && <ProfileTab token={token!} me={me} onRefresh={refreshMe} />}
              {tab === "password" && <PasswordTab token={token!} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">{body}</p>
    </div>
  );
}

// Overview ---------------------------------------------------------------

function OverviewTab({
  orders,
  me,
  onGoto,
}: {
  orders: OrderRow[];
  me: MeData | null;
  onGoto: (tab: AccountTabId) => void;
}) {
  const activeShipments = orders.filter((o) =>
    ["SHIPPED", "PROCESSING", "PAID"].includes(o.status),
  ).length;
  const recent = orders.slice(0, 4);
  const addresses = me?.customer?.addresses ?? [];
  const hasProfileDetails = Boolean(me?.name && me?.surname && me?.phone);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div>
      <SectionIntro
        eyebrow="Genel bakış"
        title="Hesap özeti"
        body="Sipariş durumunuzu, teslimat ayarlarınızı ve hızlı işlemleri tek yerden yönetin."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onGoto("orders")}
          className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-6 text-center transition hover:border-slate-300 hover:shadow-sm"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sky-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="3" y="6" width="8" height="12" rx="1" />
              <rect x="13" y="4" width="8" height="16" rx="1" />
            </svg>
          </span>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{orders.length}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Toplam sipariş</p>
        </button>
        <button
          type="button"
          onClick={() => onGoto("orders")}
          className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-6 text-center transition hover:border-slate-300 hover:shadow-sm"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sky-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M1 3h15v13H1V3z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="1.5" />
              <circle cx="18.5" cy="18.5" r="1.5" />
            </svg>
          </span>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{activeShipments}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aktif gönderi</p>
        </button>
        <button
          type="button"
          onClick={() => onGoto("addresses")}
          className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-6 text-center transition hover:border-slate-300 hover:shadow-sm"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sky-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 21s7-4.5 7-10a7 7 0 0 0-14 0c0 5.5 7 10 7 10z" />
              <circle cx="12" cy="11" r="2" />
            </svg>
          </span>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{addresses.length}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Kayıtlı adres</p>
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Hesap durumu</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                {hasProfileDetails ? "Profil bilgileriniz hazır" : "Profilinizi tamamlayın"}
              </h3>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                hasProfileDetails ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {hasProfileDetails ? "Tamam" : "Eksik"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Ad, soyad ve telefon bilgileriniz teslimat sürecinin daha hızlı ilerlemesini sağlar.
          </p>
          <button
            type="button"
            onClick={() => onGoto("profile")}
            className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Profili düzenle
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Varsayılan teslimat</p>
          {defaultAddress ? (
            <>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                {defaultAddress.label || defaultAddress.city}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {[defaultAddress.line1, defaultAddress.district, defaultAddress.city]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-1 text-base font-semibold text-slate-900">Adres ekleyin</h3>
              <p className="mt-2 text-sm text-slate-600">
                Checkout sırasında tek tıkla kullanmak için bir teslimat adresi kaydedin.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => onGoto("addresses")}
            className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Adresleri yönet
          </button>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Son siparişler</h2>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => onGoto("orders")}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800"
            >
              Tümünü gör
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-500">
            Henüz sipariş yok.{" "}
            <Link href="/shop" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
              Alışverişe başlayın
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((o) => {
              const title = o.items[0]?.titleSnapshot ?? "Sipariş";
              const initial = title.slice(0, 1).toUpperCase();
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4"
                >
                  <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-slate-200/90 text-lg font-bold text-slate-600">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">#{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        o.status === "DELIVERED"
                          ? "bg-slate-200 text-slate-700"
                          : o.status === "SHIPPED"
                            ? "bg-sky-100 text-sky-800"
                            : (statusClass[o.status] ?? "bg-slate-100 text-slate-700")
                      }`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{priceFmt(o.totalCents, o.currency)}</p>
                    <div className="flex gap-2">
                      <Link
                        href={`/orders/${o.id}`}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Detay
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// Orders -----------------------------------------------------------------

function OrdersTab({
  token,
  orders,
  onChange,
}: {
  token: string;
  orders: OrderRow[];
  onChange: (list: OrderRow[]) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const cancelOrder = async (id: string) => {
    setBusyId(id);
    setErr(null);
    try {
      await authFetch(token, `/orders/${id}/cancel`, { method: "POST" });
      onChange(orders.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o)));
      setCancelId(null);
      showSiteToast({ message: "Sipariş iptal edildi.", kind: "success" });
    } catch (e) {
      if (e instanceof CustomerSessionTerminated) return;
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div>
        <SectionIntro
          eyebrow="Siparişler"
          title="Sipariş geçmişi"
          body="Tamamlanan ve devam eden siparişleriniz burada listelenir."
        />
        <div className="surface-soft p-10 text-center text-sm text-slate-500">
          Henüz siparişiniz yok.{" "}
          <Link href="/#urunler" className="link-underline font-semibold text-slate-900">
            Alışverişe başlayın
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionIntro
        eyebrow="Siparişler"
        title="Sipariş geçmişi"
        body="Sipariş durumunuzu takip edin, bekleyen siparişlerde iptal işlemini buradan yönetin."
      />
      {err && (
        <pre className="mb-3 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
          {err}
        </pre>
      )}
      <ul className="space-y-3">
        {orders.map((o) => (
          <li
            key={o.id}
            className="surface-soft flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs text-slate-400">#{o.id.slice(0, 8)}…</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {o.items.slice(0, 3).map((i) => i.titleSnapshot).join(", ")}
                {o.items.length > 3 ? "…" : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(o.createdAt).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  statusClass[o.status] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {orderStatusLabel(o.status)}
              </span>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {priceFmt(o.totalCents, o.currency)}
                </p>
                <Link
                  href={`/orders/${o.id}`}
                  className="link-underline text-xs font-semibold text-sky-800"
                >
                  Detay
                </Link>
              </div>
              {o.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => setCancelId(o.id)}
                  disabled={busyId === o.id}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  {busyId === o.id ? "İptal…" : "İptal et"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={cancelId !== null}
        title="Siparişi iptal et"
        description="Bu sipariş iptal edilecek. Devam etmek istiyor musunuz?"
        confirmLabel="Evet, iptal et"
        cancelLabel="Vazgeç"
        variant="danger"
        busy={cancelId !== null && busyId === cancelId}
        onCancel={() => setCancelId(null)}
        onConfirm={() => {
          if (cancelId) void cancelOrder(cancelId);
        }}
      />
    </div>
  );
}

// Addresses --------------------------------------------------------------

type AddrForm = {
  label: string;
  contactName: string;
  phone: string;
  line1: string;
  line2: string;
  district: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

const emptyForm: AddrForm = {
  label: "",
  contactName: "",
  phone: "",
  line1: "",
  line2: "",
  district: "",
  city: "",
  postalCode: "",
  isDefault: false,
};

function AddressesTab({
  token,
  me,
  onRefresh,
}: {
  token: string;
  me: MeData | null;
  onRefresh: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddrForm>(emptyForm);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const addresses = me?.customer?.addresses ?? [];

  const startEdit = (a?: AddressRow) => {
    setErr(null);
    if (a) {
      setForm({
        label: a.label ?? "",
        contactName: a.contactName ?? "",
        phone: a.phone ?? "",
        line1: a.line1,
        line2: a.line2 ?? "",
        district: a.district ?? "",
        city: a.city,
        postalCode: a.postalCode ?? "",
        isDefault: a.isDefault,
      });
      setEditingId(a.id);
    } else {
      setForm(emptyForm);
      setEditingId("new");
    }
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        label: form.label || undefined,
        contactName: form.contactName || undefined,
        phone: form.phone || undefined,
        line1: form.line1,
        line2: form.line2 || undefined,
        district: form.district || undefined,
        city: form.city,
        postalCode: form.postalCode || undefined,
        isDefault: form.isDefault,
      };
      if (editingId === "new") {
        await authFetch(token, "/customers/me/addresses", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else if (editingId) {
        await authFetch(token, `/customers/me/addresses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }
      setEditingId(null);
      await onRefresh();
    } catch (e) {
      if (e instanceof CustomerSessionTerminated) return;
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setDeleteBusy(true);
    setErr(null);
    try {
      await authFetch(token, `/customers/me/addresses/${id}`, { method: "DELETE" });
      setDeleteId(null);
      showSiteToast({ message: "Adres silindi.", kind: "success" });
      await onRefresh();
    } catch (e) {
      if (e instanceof CustomerSessionTerminated) return;
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  const setDefault = async (id: string) => {
    setErr(null);
    try {
      await authFetch(token, `/customers/me/addresses/${id}/default`, { method: "POST" });
      await onRefresh();
    } catch (e) {
      if (e instanceof CustomerSessionTerminated) return;
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div>
      <SectionIntro
        eyebrow="Teslimat"
        title="Adres defteri"
        body="Kayıtlı adresleriniz checkout sırasında hızlı teslimat seçimi için kullanılır."
      />
      {err && (
        <pre className="mb-3 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
          {err}
        </pre>
      )}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {addresses.length === 0
            ? "Henüz adres eklemediniz."
            : `${addresses.length} kayıtlı adres`}
        </p>
        <button type="button" onClick={() => startEdit()} className="btn-primary">
          + Yeni adres
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) => (
          <article key={a.id} className="surface-soft p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {a.label || "Adres"}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {a.contactName || "—"}
                </p>
              </div>
              {a.isDefault && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Varsayılan
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-700">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
              <br />
              {[a.district, a.city, a.postalCode].filter(Boolean).join(" / ")}
            </p>
            {a.phone && <p className="mt-1 text-xs text-slate-500">{a.phone}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => startEdit(a)}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Düzenle
              </button>
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(a.id)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Varsayılan yap
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteId(a.id)}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                Sil
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Adresi sil"
        description="Bu adres kalıcı olarak silinecek. Emin misiniz?"
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        variant="danger"
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) void remove(deleteId);
        }}
      />

      {editingId && (
        <div
        className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
          role="dialog"
        >
          <div className="surface-soft w-full max-w-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId === "new" ? "Yeni adres" : "Adresi düzenle"}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <LabelInput label="Etiket (Ev, Ofis…)" value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
              <LabelInput label="Alıcı adı" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
              <LabelInput label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="05xx xxx xx xx" />
              <LabelInput label="Posta kodu" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} placeholder="34000" />
              <div className="sm:col-span-2">
                <LabelInput
                  label="Adres"
                  value={form.line1}
                  onChange={(v) => setForm({ ...form, line1: v })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <LabelInput
                  label="Adres (devamı)"
                  value={form.line2}
                  onChange={(v) => setForm({ ...form, line2: v })}
                />
              </div>
              <LabelInput label="İlçe" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
              <LabelInput label="Şehir" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Varsayılan adres olarak ayarla
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="btn-ghost"
                disabled={busy}
              >
                Vazgeç
              </button>
              <button type="button" onClick={save} disabled={busy} className="btn-primary">
                {busy ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input-soft"
      />
    </label>
  );
}

// Profile ----------------------------------------------------------------

function ProfileTab({
  token,
  me,
  onRefresh,
}: {
  token: string;
  me: MeData | null;
  onRefresh: () => Promise<void>;
}) {
  const initial = useMemo(
    () => ({
      name: me?.name ?? "",
      surname: me?.surname ?? "",
      phone: me?.phone ?? "",
      birthDate: me?.birthDate ? me.birthDate.slice(0, 10) : "",
      marketingOptIn: me?.marketingOptIn ?? false,
    }),
    [me],
  );
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setForm(initial), [initial]);

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await authFetch(token, "/customers/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name || undefined,
          surname: form.surname || undefined,
          phone: form.phone || undefined,
          birthDate: form.birthDate || undefined,
          marketingOptIn: form.marketingOptIn,
        }),
      });
      await onRefresh();
      setMsg("Profil güncellendi");
    } catch (e) {
      if (e instanceof CustomerSessionTerminated) return;
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionIntro
        eyebrow="Profil"
        title="Kişisel bilgiler"
        body="Teslimat ve hesap iletişimi için kullanılan bilgilerinizi güncel tutun."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <LabelInput label="Ad" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <LabelInput
          label="Soyad"
          value={form.surname}
          onChange={(v) => setForm({ ...form, surname: v })}
        />
        <LabelInput
          label="Telefon"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="05xx xxx xx xx"
        />
        <LabelInput
          label="Doğum tarihi"
          type="date"
          value={form.birthDate}
          onChange={(v) => setForm({ ...form, birthDate: v })}
        />
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.marketingOptIn}
          onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
        />
        E-posta kampanyalarından haberdar olmak istiyorum
      </label>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {err && (
        <pre className="mt-4 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
          {err}
        </pre>
      )}
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

// Password ---------------------------------------------------------------

function PasswordTab({ token }: { token: string }) {
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    setMsg(null);
    if (next.length < 8) {
      setErr("Yeni şifre en az 8 karakter olmalı");
      return;
    }
    if (next !== confirm) {
      setErr("Şifreler eşleşmiyor");
      return;
    }
    setBusy(true);
    try {
      await authFetch(token, "/customers/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: curr, newPassword: next }),
      });
      setCurr("");
      setNext("");
      setConfirm("");
      setMsg("Şifre değiştirildi");
    } catch (e) {
      if (e instanceof CustomerSessionTerminated) return;
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg">
      <SectionIntro
        eyebrow="Güvenlik"
        title="Şifre değiştir"
        body="Hesabınızı korumak için güçlü ve benzersiz bir şifre kullanın."
      />
      <div className="grid gap-3">
        <LabelInput
          label="Mevcut şifre"
          type="password"
          value={curr}
          onChange={setCurr}
          required
        />
        <LabelInput
          label="Yeni şifre"
          type="password"
          value={next}
          onChange={setNext}
          required
        />
        <LabelInput
          label="Yeni şifre (tekrar)"
          type="password"
          value={confirm}
          onChange={setConfirm}
          required
        />
      </div>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {err && (
        <pre className="mt-4 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
          {err}
        </pre>
      )}
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Kaydediliyor…" : "Şifreyi değiştir"}
        </button>
      </div>
    </div>
  );
}
