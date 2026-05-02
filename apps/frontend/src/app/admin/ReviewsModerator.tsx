"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { id: string; name: string | null; email: string } | null;
};

type Filter = "all" | "pending" | "approved";

export function ReviewsModerator({ token }: { token: string }) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await adminFetch(`/admin/reviews?filter=${filter}`, token)) as ReviewRow[];
      setRows(res);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Yorumlar alınamadı");
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setApproved(id: string, value: boolean) {
    setBusy(id);
    try {
      await adminFetch(`/admin/reviews/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ isApproved: value }),
      });
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setError(msg);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Yorum silinsin mi?")) return;
    setBusy(id);
    try {
      await adminFetch(`/admin/reviews/${id}`, token, { method: "DELETE" });
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Silinemedi");
      if (msg) setError(msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Yorum moderasyonu</h2>
          <p className="text-sm text-slate-600">
            Misafir kullanıcı yorumları onay bekler, onayladıklarınız ürün sayfasında görünür.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded-md bg-slate-900 px-3 py-1.5 text-white"
                  : "rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              }
            >
              {f === "pending" ? "Bekleyen" : f === "approved" ? "Onaylı" : "Tümü"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Yükleniyor…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Bu kategoride yorum yok.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-amber-600">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="text-slate-600">
                      {r.user?.name || r.user?.email || r.authorName || "Misafir"}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      {new Date(r.createdAt).toLocaleString("tr-TR")}
                    </span>
                    {!r.isApproved ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Onay bekliyor
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    <span className="font-medium">{r.product.name}</span>
                    <span className="ml-2 text-slate-400">/{r.product.slug}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {r.isApproved ? (
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => setApproved(r.id, false)}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Onayı kaldır
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => setApproved(r.id, true)}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Onayla
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => remove(r.id)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
              {r.title ? <h3 className="mt-3 font-medium">{r.title}</h3> : null}
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
