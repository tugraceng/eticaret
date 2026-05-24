"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

type SuggestRow = { id: string; slug: string; name: string };

type Props = {
  variant?: "desktop" | "mobile" | "sheet";
  /** Örn. mobil arama panelini kapat */
  onNavigate?: () => void;
  /** Ana sayfa hero üstü: açık renk çerçeve / metin */
  heroOverlay?: boolean;
  /** Arama kutusu yer tutucu metni */
  searchPlaceholder?: string;
};

export function SiteHeaderSearch({
  variant = "desktop",
  onNavigate,
  heroOverlay = false,
  searchPlaceholder = "Ürün ara…",
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<SuggestRow[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromUrl = sp.get("q")?.trim() ?? "";
    if (pathname === "/shop" || pathname === "/") {
      setQ(fromUrl);
    }
  }, [pathname, sp]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setSuggest([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(async () => {
      setBusy(true);
      setOpen(true);
      try {
        const res = await fetch(`${apiUrl("/products/suggest")}?q=${encodeURIComponent(term)}&limit=6`);
        if (!res.ok) {
          if (!cancelled) setSuggest([]);
          return;
        }
        const data = (await res.json()) as SuggestRow[];
        if (!cancelled) setSuggest(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSuggest([]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    const v = q.trim();
    const next = new URLSearchParams();
    if (v) next.set("q", v);
    next.set("sort", "newest");
    const qs = next.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
    onNavigate?.();
  }

  const termOk = q.trim().length >= 2;
  const showPanel = useMemo(() => open && termOk, [open, termOk]);

  const isDesktop = variant === "desktop";
  const isSheet = variant === "sheet";

  const formClass =
    isDesktop
      ? "hidden min-h-[2.5rem] w-full min-w-0 items-center gap-2 md:flex"
      : isSheet
        ? "flex w-full flex-col gap-3"
        : "mb-3 flex w-full items-stretch gap-2 rounded-xl border border-white/12 bg-[#0a0f18] px-3 py-2";

  return (
    <form
      onSubmit={onSubmit}
      action="/shop"
      className={formClass}
    >
      <div ref={wrapRef} className={isDesktop ? "relative min-w-0 flex-1" : "relative min-w-0 flex-1"}>
        <label htmlFor={`header-search-${variant}`} className="sr-only">
          Ürün ara
        </label>
        <div
          className={
            isDesktop
              ? heroOverlay
                ? "flex min-h-[2.5rem] items-center gap-2 rounded-full border border-white/30 bg-black/20 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
                : "si-header-search flex min-h-[2.875rem] items-center gap-2.5 px-4 py-2"
              : isSheet
                ? "flex items-center gap-2 rounded-xl border border-white/12 bg-[#0a0f18] px-3 py-2.5"
                : "flex items-center gap-2"
          }
        >
          {isDesktop || isSheet ? (
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 shrink-0 ${heroOverlay ? "text-white/70" : isSheet ? "text-slate-400" : "text-slate-500"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          ) : null}
          <input
            id={`header-search-${variant}`}
            name="q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => termOk && setOpen(true)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className={
              isDesktop || isSheet
                ? heroOverlay
                  ? "w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                  : isSheet
                    ? "w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    : "w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                : "w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            }
          />
        </div>
        {showPanel && (
          <div
            className={cn(
              "z-50 max-h-[min(50vh,280px)] w-full overflow-auto rounded-xl border border-white/10 bg-[#121a28] shadow-xl",
              isDesktop || (!isSheet && !isDesktop) ? "absolute left-0 right-0 mt-1" : "mt-2",
            )}
          >
            {busy ? <p className="px-3 py-2 text-xs text-slate-400">Aranıyor…</p> : null}
            {!busy && suggest.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">Eşleşen ürün yok. Tüm sonuçlar için Ara&apos;ya basın.</p>
            ) : null}
            {!busy &&
              suggest.map((s) => (
                <Link
                  prefetch={false}
                  key={s.id}
                  href={`/shop/${s.slug}`}
                  className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/8"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  {s.name}
                </Link>
              ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        className={
          isDesktop
            ? heroOverlay
              ? "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/50 bg-white text-neutral-900 shadow-md transition hover:bg-neutral-50"
              : "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-600 text-white shadow-md transition hover:bg-sky-500"
            : isSheet
              ? "w-full rounded-xl bg-[#e8edf5] py-2.5 text-sm font-semibold text-[#0c0e12] shadow-md transition hover:bg-white"
              : "shrink-0 self-center text-xs font-semibold text-slate-300"
        }
        aria-label={isSheet ? "Mağazada ara" : "Ara"}
      >
        {isDesktop ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        ) : isSheet ? (
          "Mağazada ara"
        ) : (
          "Ara"
        )}
      </button>
    </form>
  );
}
