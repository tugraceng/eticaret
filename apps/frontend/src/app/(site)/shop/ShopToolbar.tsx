"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function ShopToolbar() {
  const pathname = usePathname() ?? "/shop";
  const router = useRouter();
  const sp = useSearchParams();
  const qParam = sp.get("q") ?? "";
  const [q, setQ] = useState(qParam);
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [suggestSettled, setSuggestSettled] = useState(false);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(sp.toString());
    const v = q.trim();
    if (v) next.set("q", v);
    else next.delete("q");
    if (!next.get("sort")) next.set("sort", "newest");
    const qs = next.toString();
    router.push(pathname === "/" ? (qs ? `/?${qs}#urunler` : "/#urunler") : qs ? `/shop?${qs}` : "/shop");
  }

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setSuggest([]);
      setSuggestSettled(false);
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(async () => {
      setBusy(true);
      setSuggestSettled(false);
      try {
        const res = await fetch(`${apiUrl("/products/suggest")}?q=${encodeURIComponent(term)}&limit=6`);
        if (!res.ok) {
          if (!cancelled) setSuggest([]);
          return;
        }
        const data = (await res.json()) as Array<{ id: string; slug: string; name: string }>;
        if (!cancelled) setSuggest(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSuggest([]);
      } finally {
        if (!cancelled) {
          setBusy(false);
          setSuggestSettled(true);
        }
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [q]);

  const showSuggest = useMemo(
    () => q.trim().length >= 2 && (busy || suggestSettled),
    [q, busy, suggestSettled],
  );

  return (
    <form
      onSubmit={onSubmit}
      className="shop-toolbar flex w-full max-w-none flex-col gap-2.5 sm:max-w-xl sm:flex-row sm:items-stretch sm:gap-3"
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="shop-search-q" className="sr-only">
          Ürün ara
        </label>
        <div className="relative">
          <div className="flex min-h-[2.875rem] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition-[box-shadow,border-color] focus-within:border-slate-300 focus-within:shadow-md focus-within:ring-slate-900/[0.06]">
          <span
            className="flex w-[3.25rem] shrink-0 items-center justify-center border-r border-slate-100 bg-slate-50 text-slate-400"
            aria-hidden
          >
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            id="shop-search-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün veya kategori ara…"
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-[15px] leading-snug text-slate-900 placeholder:text-slate-400 outline-none focus:ring-0 sm:text-sm"
            autoComplete="off"
            enterKeyHint="search"
          />
          </div>
          {showSuggest && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {busy ? <p className="px-3 py-2 text-xs text-slate-500">Aranıyor…</p> : null}
              {!busy && suggest.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500">Öneri bulunamadı. Tüm sonuçlar için Ara&apos;ya basın.</p>
              ) : null}
              {!busy &&
                suggest.map((s) => (
                  <Link
                    prefetch={false}
                    key={s.id}
                    href={`/shop/${s.slug}`}
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {s.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex h-[2.875rem] shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 active:scale-[0.98] sm:w-auto sm:rounded-full sm:px-8"
      >
        Ara
      </button>
    </form>
  );
}
