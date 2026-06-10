"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import {
  clearCustomerSession,
  CustomerSessionTerminated,
  getCustomerToken,
  redirectCustomerToLogin,
} from "@/lib/platform-session";
import { AccountDashboardSidebar } from "@/components/account/AccountDashboardSidebar";
import { CustomerReturns } from "@/components/account/CustomerReturns";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { ProvinceDistrictSelect } from "@/components/forms/ProvinceDistrictSelect";
import { isTrProvinceDistrictValid } from "@/lib/tr-province-district";
import { showSiteToast } from "@/lib/site-toast";
import { isAccountTabId, type AccountTabId } from "@/components/account/account-tab-ids";
import { orderListStatusBadgeClass, orderListStatusLabel } from "@/lib/order-display-status";

type OrderRow = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { titleSnapshot: string; quantity: number }[];
  returns?: { status: string }[];
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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<AccountTabId>("overview");
  const [ordersFilter, setOrdersFilter] = useState<"all" | "active">("all");
  const [me, setMe] = useState<MeData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    const tok = getCustomerToken();
    setSessionChecked(true);
    if (!tok) {
      router.replace("/hesap/giris");
      return;
    }
    setToken(tok);
    let cancel = false;
    let sessionEnded = false;
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
        if (e instanceof CustomerSessionTerminated) {
          sessionEnded = true;
          return;
        }
        if (!cancel) setLoadErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel && !sessionEnded) setPhase("ok");
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
    (id: AccountTabId, opts?: { ordersFilter?: "all" | "active" }) => {
      setTab(id);
      if (opts?.ordersFilter) setOrdersFilter(opts.ordersFilter);
      else if (id !== "orders") setOrdersFilter("all");
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
    clearCustomerSession();
    router.replace("/hesap/giris");
  }, [router]);

  if (sessionChecked && !token) {
    return (
      <div className="si-account-page min-h-[40vh]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-slate-400">Giriş sayfasına yönlendiriliyor…</p>
        </div>
      </div>
    );
  }

  if (!sessionChecked || phase !== "ok") {
    return (
      <div className="si-account-page min-h-[40vh]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-6 text-center text-sm text-slate-400">Hesabınız yükleniyor…</p>
          <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            <div className="h-64 w-52 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-80 flex-1 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const fullName =
    [me?.name, me?.surname].filter(Boolean).join(" ").trim() || me?.email || "Hesabım";
  const greetName = (me?.name || me?.surname || fullName).split(" ")[0] ?? fullName;

  return (
    <div className="si-account-page">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
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
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
                  Merhaba, {greetName}
                </h1>
                <p className="mt-1 text-sm text-slate-400">Siparişlerinizi ve bilgilerinizi buradan yönetin.</p>
                <p className="mt-0.5 text-xs text-slate-500">{me?.email}</p>
              </div>
              <Link href="/shop" className="btn-ghost ring-1 ring-slate-200/80">
                Alışverişe devam
              </Link>
            </div>

            <div className="si-account-panel p-4 sm:p-6 lg:p-7">
              {tab === "overview" && <OverviewTab orders={orders} me={me} onGoto={selectTab} />}
              {tab === "orders" && (
                <OrdersTab
                  token={token!}
                  orders={orders}
                  onChange={setOrders}
                  filter={ordersFilter}
                />
              )}
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
    <div className="si-account-section-intro mb-6 border-b border-white/10 pb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-400">{body}</p>
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
  onGoto: (tab: AccountTabId, opts?: { ordersFilter?: "all" | "active" }) => void;
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button type="button" onClick={() => onGoto("orders", { ordersFilter: "all" })} className="si-account-stat-card">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/15 text-sky-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="3" y="6" width="8" height="12" rx="1" />
              <rect x="13" y="4" width="8" height="16" rx="1" />
            </svg>
          </span>
          <p className="si-stat-value">{orders.length}</p>
          <p className="si-stat-label">Toplam sipariş</p>
        </button>
        <button
          type="button"
          onClick={() => onGoto("orders", { ordersFilter: "active" })}
          className="si-account-stat-card"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/15 text-violet-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M1 3h15v13H1V3z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="1.5" />
              <circle cx="18.5" cy="18.5" r="1.5" />
            </svg>
          </span>
          <p className="si-stat-value">{activeShipments}</p>
          <p className="si-stat-label">Aktif gönderi</p>
        </button>
        <button type="button" onClick={() => onGoto("addresses")} className="si-account-stat-card">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 21s7-4.5 7-10a7 7 0 0 0-14 0c0 5.5 7 10 7 10z" />
              <circle cx="12" cy="11" r="2" />
            </svg>
          </span>
          <p className="si-stat-value">{addresses.length}</p>
          <p className="si-stat-label">Kayıtlı adres</p>
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="si-account-inner-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Hesap durumu</p>
              <h3 className="mt-1 text-base font-semibold text-slate-100">
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
          <p className="mt-2 text-sm text-slate-400">
            Ad, soyad ve telefon bilgileriniz teslimat sürecinin daha hızlı ilerlemesini sağlar.
          </p>
          <button
            type="button"
            onClick={() => onGoto("profile")}
            className="si-account-btn-secondary mt-4"
          >
            Profili düzenle
          </button>
        </div>

        <div className="si-account-inner-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Varsayılan teslimat</p>
          {defaultAddress ? (
            <>
              <h3 className="mt-1 text-base font-semibold text-slate-100">
                {defaultAddress.label || defaultAddress.city}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                {[defaultAddress.line1, defaultAddress.district, defaultAddress.city]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-1 text-base font-semibold text-slate-100">Adres ekleyin</h3>
              <p className="mt-2 text-sm text-slate-400">
                Checkout sırasında tek tıkla kullanmak için bir teslimat adresi kaydedin.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => onGoto("addresses")}
            className="si-account-btn-secondary mt-4"
          >
            Adresleri yönet
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-100">Son siparişler</h2>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => onGoto("orders")}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300"
            >
              Tümünü gör
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="si-account-empty py-8">
            <p className="text-sm text-slate-400">
              Henüz sipariş yok.{" "}
              <Link href="/shop" className="font-semibold text-sky-400 underline-offset-2 hover:underline">
                Alışverişe başlayın
              </Link>
            </p>
          </div>
        ) : (
          <div className="si-order-cards-rail">
            {recent.map((o) => {
              const title = o.items[0]?.titleSnapshot ?? "Sipariş";
              return (
                <article
                  key={o.id}
                  className="si-order-summary-card flex flex-col p-4"
                >
                  <p className="font-mono text-[10px] text-slate-500">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-100">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-auto pt-2 text-base font-semibold tabular-nums text-slate-100">
                    {priceFmt(o.totalCents, o.currency)}
                  </p>
                  <span
                    className={`mt-2 self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${orderListStatusBadgeClass(o.status, o.returns)}`}
                  >
                    {orderListStatusLabel(o.status, o.returns)}
                  </span>
                  <Link
                    href={`/orders/${o.id}`}
                    className="si-account-btn-secondary mt-3 w-full text-center"
                  >
                    Detay
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Orders -----------------------------------------------------------------

function OrderSummaryCards({
  orders,
  busyId,
  onCancel,
}: {
  orders: OrderRow[];
  busyId: string | null;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="si-order-cards-rail" role="list" aria-label="Sipariş özet kartları">
      {orders.map((o) => (
        <article
          key={o.id}
          role="listitem"
          className="si-order-summary-card flex flex-col p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-[11px] text-slate-500">#{o.id.slice(0, 8).toUpperCase()}</p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${orderListStatusBadgeClass(o.status, o.returns)}`}
            >
              {orderListStatusLabel(o.status, o.returns)}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {new Date(o.createdAt).toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-100">
            {o.items.slice(0, 2).map((i) => i.titleSnapshot).join(", ")}
            {o.items.length > 2 ? "…" : ""}
          </p>
          <p className="mt-auto pt-3 text-lg font-semibold tabular-nums text-slate-100">
            {priceFmt(o.totalCents, o.currency)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/orders/${o.id}`}
              className="si-account-btn-primary mt-3 inline-flex flex-1 items-center justify-center"
            >
              Detay
            </Link>
            {o.status === "PENDING" ? (
              <button
                type="button"
                onClick={() => onCancel(o.id)}
                disabled={busyId === o.id}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                {busyId === o.id ? "İptal…" : "İptal"}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function OrdersTab({
  token,
  orders,
  onChange,
  filter = "all",
}: {
  token: string;
  orders: OrderRow[];
  onChange: (list: OrderRow[]) => void;
  filter?: "all" | "active";
}) {
  const visible =
    filter === "active"
      ? orders.filter((o) => ["SHIPPED", "PROCESSING", "PAID"].includes(o.status))
      : orders;
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
        <div className="si-account-empty">
          <div className="si-account-empty-icon" aria-hidden>
            📦
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-200">Henüz siparişiniz yok</p>
          <p className="mt-1 max-w-xs text-sm text-slate-400">
            İlk siparişinizi verdiğinizde özet kartlar burada görünecek.
          </p>
          <Link href="/shop" className="si-account-btn-primary mt-5">
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
        title={filter === "active" ? "Aktif gönderiler" : "Sipariş geçmişi"}
        body={
          filter === "active"
            ? "Kargoda veya hazırlanan siparişleriniz."
            : "Sipariş durumunuzu takip edin, bekleyen siparişlerde iptal işlemini buradan yönetin."
        }
      />
      {err && (
        <pre className="mb-3 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
          {err}
        </pre>
      )}
      {visible.length === 0 ? (
        <div className="si-account-empty py-8">
          <p className="text-sm text-slate-400">Aktif gönderi bulunmuyor.</p>
        </div>
      ) : (
        <OrderSummaryCards
          orders={visible}
          busyId={busyId}
          onCancel={(id) => setCancelId(id)}
        />
      )}
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
      if (!form.line1.trim()) {
        setErr("Adres satırı zorunlu.");
        setBusy(false);
        return;
      }
      if (!form.city.trim()) {
        setErr("İl seçmelisiniz.");
        setBusy(false);
        return;
      }
      if (!form.district.trim()) {
        setErr("İlçe seçmelisiniz.");
        setBusy(false);
        return;
      }
      if (!isTrProvinceDistrictValid(form.city.trim(), form.district.trim())) {
        setErr("Geçerli il ve ilçe seçin.");
        setBusy(false);
        return;
      }
      const body = {
        label: form.label || undefined,
        contactName: form.contactName || undefined,
        phone: form.phone || undefined,
        line1: form.line1.trim(),
        line2: form.line2 || undefined,
        district: form.district.trim(),
        city: form.city.trim(),
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
              <div className="sm:col-span-2">
                <ProvinceDistrictSelect
                  province={form.city}
                  district={form.district}
                  onProvinceChange={(v) => setForm((f) => ({ ...f, city: v, district: "" }))}
                  onDistrictChange={(v) => setForm((f) => ({ ...f, district: v }))}
                />
              </div>
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
