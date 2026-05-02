"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { cn } from "@/lib/cn";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  createdAt: string;
};

type ReviewsResponse = {
  items: ReviewItem[];
  average: number;
  count: number;
};

function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`${cls} ${i <= Math.round(value) ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.9 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.8l7.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex" role="radiogroup" aria-label="Puan">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className={`h-8 w-8 ${
            i <= (hover || value) ? "text-amber-400" : "text-slate-200"
          } transition-colors hover:text-amber-400`}
          aria-label={`${i} yıldız`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
            <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.9 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.8l7.1-.7z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function Reviews({
  slug,
  className = "",
  heading = "Müşteri yorumları",
  kicker = "Değerlendirmeler",
}: {
  slug: string;
  /** Bölüm sarmalayıcıya ek sınıflar (ör. PDP stili) */
  className?: string;
  heading?: string;
  kicker?: string;
}) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiJson<ReviewsResponse>(`/products/${slug}/reviews`);
      setData(res);
    } catch {
      setData({ items: [], average: 0, count: 0 });
    }
  }, [slug]);

  useEffect(() => {
    void load();
    try {
      setLoggedIn(Boolean(sessionStorage.getItem(CUSTOMER_TOKEN_KEY)));
    } catch {
      setLoggedIn(false);
    }
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Lütfen bir puan seçin.");
      return;
    }
    if (body.trim().length < 5) {
      setError("Yorumunuz en az 5 karakter olmalı.");
      return;
    }
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
      await apiJson(`/products/${slug}/reviews`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          authorName: token ? undefined : authorName.trim() || undefined,
        }),
      });
      setRating(0);
      setTitle("");
      setBody("");
      setAuthorName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`mt-16 border-t border-slate-200 pt-12 ${className}`.trim()}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {kicker}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {heading}
          </h2>
        </div>
        {data && data.count > 0 && (
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Stars value={data.average} size="lg" />
              <span className="text-2xl font-semibold text-slate-900">
                {data.average.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{data.count} değerlendirme</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {data && data.items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
              Henüz yorum yapılmamış. İlk yorumu siz yazın!
            </div>
          )}
          {data?.items.map((r) => (
            <article key={r.id} className="surface-soft p-5">
              <header className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.author}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <Stars value={r.rating} />
              </header>
              {r.title && <p className="mt-3 font-semibold text-slate-900">{r.title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {r.body}
              </p>
            </article>
          ))}
        </div>

        <aside>
          <form onSubmit={submit} className="surface-soft space-y-3 p-5">
            <h3 className="text-base font-semibold text-slate-900">Ürüne puan verin</h3>
            <StarInput value={rating} onChange={setRating} />
            {!loggedIn && (
              <input
                type="text"
                placeholder="Adınız (opsiyonel)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="input-soft"
              />
            )}
            <input
              type="text"
              placeholder="Başlık (opsiyonel)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-soft"
            />
            <textarea
              placeholder="Deneyiminizi paylaşın…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="input-soft"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className={cn("store-cta-primary", "py-2.5 text-xs")}
            >
              {submitting ? "Gönderiliyor…" : "Yorum yaz"}
            </button>
            <p className="text-[11px] text-slate-500">
              Yorumlar moderasyon sonrası yayınlanır. Saygılı ve yapıcı olun.
            </p>
          </form>
        </aside>
      </div>
    </section>
  );
}
