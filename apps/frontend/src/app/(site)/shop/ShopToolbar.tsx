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
          <div className="si-shop-search flex min-h-[2.875rem] w-full overflow-hidden rounded-xl">
            <span
              className="flex w-11 shrink-0 items-center justify-center border-r border-white/10 text-slate-500"
              aria-hidden
            >
              <SearchIcon className="h-5 w-5" />
            </span>
            <input
              id="shop-search-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün veya kategori ara…"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm leading-snug text-slate-100 placeholder:text-slate-500 outline-none focus:ring-0"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          {showSuggest && (
            <div className="si-shop-suggest absolute z-30 mt-1 w-full overflow-hidden rounded-xl">
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
                    className="block px-3 py-2 text-sm text-slate-300 hover:bg-white/6 hover:text-white"
                  >
                    {s.name}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
      <button type="submit" className="si-shop-search-btn">
        Ara
      </button>
    </form>
  );
}
