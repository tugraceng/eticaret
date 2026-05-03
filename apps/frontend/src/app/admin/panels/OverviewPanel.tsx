"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminCard, Icon, StatCard, StatusBadge } from "../ui";
import type {
  AdminCounters,
  AnalyticsRow,
  NotificationRow,
  OrderRow,
  ProductRow,
  SalesInsights,
} from "../types";

export function OverviewPanel({
  analytics,
  products,
  orders,
  notifications,
  insights,
  busy,
  counters,
}: {
  analytics: AnalyticsRow[];
  products: ProductRow[];
  orders: OrderRow[];
  notifications: NotificationRow[];
  insights: SalesInsights | null;
  busy: boolean;
  counters: AdminCounters;
}) {
  const revenue = orders.reduce((s, o) => s + (o.totalCents || 0), 0);
  const pendingOrdersLocal = orders.filter((o) => o.status === "PENDING").length;
  const publishedProducts = products.filter((p) => p.isPublished).length;
  const draftCount = products.length - publishedProducts;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [orders],
  );

  const ordersToday = useMemo(
    () => orders.filter((o) => new Date(o.createdAt) >= startOfToday).length,
    [orders, startOfToday],
  );

  const quickLinks = [
    { href: "/admin/categories", label: "Kategoriler", hint: "Ürün grupları", icon: Icon.Folder },
    { href: "/admin/products", label: "Ürünler", hint: "Ekle veya düzenle", icon: Icon.Box },
    { href: "/admin/orders", label: "Siparişler", hint: "Durum güncelle", icon: Icon.Bag },
    { href: "/admin/marketing", label: "Kampanyalar", hint: "E-posta ve terk edilmiş sepet", icon: Icon.Megaphone },
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

      {(counters.lowStock > 0 ||
        counters.pendingReviews > 0 ||
        counters.pendingReturns > 0 ||
        counters.pendingOrders > 0 ||
        (counters.abandonedCartCount ?? 0) > 0 ||
        unreadNotifs > 0) && (
        <AdminCard
          tone="warning"
          title="Dikkat gerektiren konular"
          description="Aşağıdaki başlıklara tıklayarak ilgili sayfaya gidebilirsiniz."
        >
          <ul className="space-y-2 text-sm text-amber-950">
            {counters.pendingOrders > 0 ? (
              <li>
                <Link className="font-semibold underline-offset-2 hover:underline" href="/admin/orders">
                  Ödeme / onay bekleyen sipariş: {counters.pendingOrders}
                </Link>
              </li>
            ) : null}
            {counters.lowStock > 0 ? (
              <li>
                <Link className="font-semibold underline-offset-2 hover:underline" href="/admin/stock">
                  Düşük stok uyarısı (ürün): {counters.lowStock}
                </Link>
              </li>
            ) : null}
            {counters.pendingReviews > 0 ? (
              <li>
                <Link className="font-semibold underline-offset-2 hover:underline" href="/admin/reviews">
                  Onay bekleyen yorum: {counters.pendingReviews}
                </Link>
              </li>
            ) : null}
            {counters.pendingReturns > 0 ? (
              <li>
                <Link className="font-semibold underline-offset-2 hover:underline" href="/admin/returns">
                  Bekleyen iade talebi: {counters.pendingReturns}
                </Link>
              </li>
            ) : null}
            {unreadNotifs > 0 ? (
              <li>
                <Link className="font-semibold underline-offset-2 hover:underline" href="/admin/notifications">
                  Okunmamış bildirim: {unreadNotifs}
                </Link>
              </li>
            ) : null}
            {(counters.abandonedCartCount ?? 0) > 0 ? (
              <li>
                <Link className="font-semibold underline-offset-2 hover:underline" href="/admin/marketing">
                  Terk edilmiş sepet kaydı: {counters.abandonedCartCount}
                </Link>
              </li>
            ) : null}
          </ul>
        </AdminCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard
          label="Bugünkü ciro (ödenen siparişler)"
          value={(counters.todayRevenueCents / 100).toLocaleString("tr-TR", {
            style: "currency",
            currency: orders[0]?.currency ?? "TRY",
            maximumFractionDigits: 0,
          })}
          hint="İptal edilmemiş siparişlerin toplamı"
          icon={<Icon.Bag />}
          tone="emerald"
        />
        <StatCard
          label="Kampanya izni (KVKK+)"
          value={counters.marketingOptInCount}
          hint="E-posta kampanyasına uygun müşteri"
          icon={<Icon.Users />}
          tone="sky"
        />
        <StatCard
          label="Terk edilmiş sepet"
          value={counters.abandonedCartCount}
          hint="Giriş yapmış, sepetinde ürün"
          icon={<Icon.Bag />}
          tone="amber"
        />
      </div>

      {counters.lastCampaign ? (
        <AdminCard title="Son tamamlanan kampanya" description="Gönderim özeti (admin bildirimleriyle eşlenir).">
          <p className="text-sm text-slate-800">
            <span className="font-semibold">{counters.lastCampaign.title}</span> — alıcı:{" "}
            {counters.lastCampaign.recipientCount}, başarılı: {counters.lastCampaign.successCount}, hata:{" "}
            {counters.lastCampaign.failCount}
          </p>
          {counters.lastCampaign.sentAt ? (
            <p className="mt-1 text-xs text-slate-500">
              {new Date(counters.lastCampaign.sentAt).toLocaleString("tr-TR")}
            </p>
          ) : null}
        </AdminCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Bugünkü sipariş"
          value={ordersToday}
          hint="Bu gece yarısından beri"
          icon={<Icon.Bag />}
          tone="emerald"
        />
        <StatCard
          label="Bekleyen sipariş"
          value={pendingOrdersLocal}
          hint="Durum: beklemede"
          icon={<Icon.Bell />}
          tone="amber"
        />
        <StatCard
          label="Düşük stok"
          value={counters.lowStock}
          hint="Eşik altı ürün"
          icon={<Icon.Layers />}
          tone="rose"
        />
        <StatCard
          label="Toplam ürün"
          value={products.length}
          hint={`${publishedProducts} yayında`}
          icon={<Icon.Box />}
          tone="sky"
        />
        <StatCard
          label="Taslak ürün"
          value={draftCount}
          hint="Yayında değil"
          icon={<Icon.Doc />}
          tone="slate"
        />
        <StatCard
          label="Okunmamış bildirim"
          value={unreadNotifs}
          hint={`${notifications.length} toplam`}
          icon={<Icon.Bell />}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Toplam ciro (liste)"
          value={(revenue / 100).toLocaleString("tr-TR", {
            style: "currency",
            currency: orders[0]?.currency ?? "TRY",
            maximumFractionDigits: 0,
          })}
          hint={`${orders.length} sipariş kaydı`}
          icon={<Icon.Bag />}
          tone="emerald"
        />
        <StatCard
          label="En çok satan (30 gün)"
          value={insights?.bestsellers?.[0]?.name ?? "—"}
          hint={
            insights?.bestsellers?.[0]
              ? `${insights.bestsellers[0].quantitySold} adet`
              : "Özet veri yüklenince görünür"
          }
          icon={<Icon.Box />}
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