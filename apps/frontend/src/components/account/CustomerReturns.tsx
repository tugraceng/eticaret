"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { getCustomerToken } from "@/lib/platform-session";

type ReturnRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  reason: string;
  note: string | null;
  createdAt: string;
  refundStatus?: string | null;
  refundCents?: number | null;
  refundDetail?: string | null;
  order: { id: string; status: string; totalCents: number; currency: string };
  items: { quantity: number; orderItem: { titleSnapshot: string } }[];
};

const LABEL: Record<ReturnRow["status"], string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı",
};

const BADGE: Record<ReturnRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-rose-100 text-rose-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

const REFUND_LABEL: Record<string, string> = {
  SUCCEEDED: "Ödeme iadesi tamam",
  SKIPPED: "Otomatik iade yok / mock",
  FAILED: "Ödeme iadesi başarısız",
};

function refundLine(r: ReturnRow): string | null {
  if (!r.refundStatus) return null;
  const title = REFUND_LABEL[r.refundStatus] ?? r.refundStatus;
  const amt =
    typeof r.refundCents === "number"
      ? (r.refundCents / 100).toLocaleString("tr-TR", {
          style: "currency",
          currency: r.order.currency,
        })
      : "";
  const tail = r.refundDetail ? ` — ${r.refundDetail}` : "";
  return `${title}${amt ? ` (${amt})` : ""}${tail}`;
}

export function CustomerReturns({
  variant = "page",
  authToken,
}: {
  variant?: "page" | "embedded";
  authToken?: string | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token =
      variant === "embedded" ? (authToken ?? null) : getCustomerToken();
    if (!token) {
      if (variant === "page") {
        router.push("/hesap/giris?redirect=/hesap/iadeler");
      } else {
        setError("Oturum bulunamadı.");
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/returns/mine"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ReturnRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [router, variant, authToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const inner = (
    <>
      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className={variant === "embedded" ? "mt-0 space-y-3" : "mt-8 space-y-3"}>
        {loading ? (
          <p className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Yükleniyor…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Henüz bir iade talebiniz yok.
          </p>
        ) : (
          rows.map((r) => {
            const refundText = refundLine(r);
            return (
            <article
              key={r.id}
              className="surface-soft p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${BADGE[r.status]}`}>
                      {LABEL[r.status]}
                    </span>
                    <span className="text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <Link
                    href={`/orders/${r.order.id}`}
                    className="mt-1 inline-block text-sm font-semibold text-slate-800 hover:underline"
                  >
                    Sipariş #{r.order.id.slice(0, 8)}
                  </Link>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {(r.order.totalCents / 100).toLocaleString("tr-TR", {
                    style: "currency",
                    currency: r.order.currency,
                  })}
                </p>
              </div>

              <p className="mt-3 rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                <span className="font-semibold">Sebep:</span> {r.reason}
              </p>

              {refundText ? (
                <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                  <span className="font-semibold">Ödeme iadesi:</span> {refundText}
                </p>
              ) : null}

              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {r.items.map((it, idx) => (
                  <li key={idx} className="flex items-center justify-between py-1.5">
                    <span>{it.orderItem.titleSnapshot}</span>
                    <span className="text-slate-500">×{it.quantity}</span>
                  </li>
                ))}
              </ul>

              {r.note ? (
                <p className="mt-2 rounded-md bg-slate-100 p-2 text-xs text-slate-600">
                  <span className="font-semibold">Mağaza notu:</span> {r.note}
                </p>
              ) : null}
            </article>
            );
          })
        )}
      </div>
    </>
  );

  if (variant === "embedded") {
    return (
      <div>
        <p className="text-sm text-slate-600">
          İade taleplerinizin durumu ve ödeme iadesi bilgisi burada listelenir.
        </p>
        {inner}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/hesap" className="link-underline text-sm text-slate-600 hover:text-slate-900">
        ← Hesabım
      </Link>

      <div className="section-shell mt-6">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-50/70 to-transparent" aria-hidden />
        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            İadelerim
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Oluşturduğunuz iade taleplerinin durumunu buradan takip edebilirsiniz.
          </p>
        </div>
      </div>
      {inner}
    </div>
  );
}
