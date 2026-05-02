"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";

type OrderRow = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { titleSnapshot: string; quantity: number }[];
};

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

export default function OrdersPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "ok">("loading");
  const [loggedIn, setLoggedIn] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [trackNo, setTrackNo] = useState("");

  useEffect(() => {
    const tok = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!tok) {
      setLoggedIn(false);
      setPhase("ok");
      return;
    }
    setLoggedIn(true);
    let cancel = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/orders/me"), {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as OrderRow[];
        if (!cancel) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancel) setPhase("ok");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  function trackSubmit(e: FormEvent) {
    e.preventDefault();
    const id = trackNo.trim();
    if (id) router.push(`/orders/${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="fade-up section-shell">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-50/70 to-transparent" aria-hidden />
        <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Siparişler
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {loggedIn ? "Siparişlerim" : "Sipariş Takibi"}
        </h1>
        </div>
      </div>

      {!loggedIn && (
        <form onSubmit={trackSubmit} className="surface-soft mt-8 p-6">
          <p className="text-sm text-slate-600">
            Sipariş numaranızı girerek durumu görüntüleyebilirsiniz.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Sipariş No
              </label>
              <input
                value={trackNo}
                onChange={(e) => setTrackNo(e.target.value)}
                className="input-soft mt-2"
                placeholder="Örn. cln3k2..."
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              Takip et <span aria-hidden>→</span>
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Hesabınız varsa{" "}
            <Link href="/hesap/giris" className="link-underline font-semibold text-slate-900">
              giriş yaparak
            </Link>{" "}
            tüm siparişlerinizi görebilirsiniz.
          </p>
        </form>
      )}

      {loggedIn && phase !== "ok" && (
        <div className="mt-8 h-48 animate-pulse rounded-3xl bg-slate-200" />
      )}

      {loggedIn && phase === "ok" && (
        <section className="mt-8">
          {err && (
            <pre className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 whitespace-pre-wrap">
              {err}
            </pre>
          )}
          {!err && orders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500 backdrop-blur">
              Henüz siparişiniz yok.{" "}
              <Link href="/#urunler" className="link-underline font-semibold text-slate-900">
                Alışverişe başlayın
              </Link>
            </div>
          )}
          {orders.length > 0 && (
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
                      {o.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {(o.totalCents / 100).toLocaleString("tr-TR", {
                          style: "currency",
                          currency: o.currency,
                        })}
                      </p>
                      <Link
                        href={`/orders/${o.id}`}
                        className="link-underline text-xs font-semibold text-sky-800"
                      >
                        Detay
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
