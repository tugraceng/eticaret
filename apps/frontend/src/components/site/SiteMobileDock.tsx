"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SiteHeaderSearch } from "@/components/site/SiteHeaderSearch";
import { shopCategoryHref, type HeaderNavCategory } from "@/lib/category-nav";
import { cn } from "@/lib/cn";
import { useCartStore, selectCartTotalQty } from "@/stores/cart-store";

type DockLink = {
  kind: "link";
  href: string;
  label: string;
  match: (p: string) => boolean;
};

type DockSearch = { kind: "search"; label: string };

type DockItem = DockLink | DockSearch;

const items: DockItem[] = [
  { kind: "link", href: "/", label: "Ana sayfa", match: (p) => p === "/" },
  { kind: "search", label: "Ara" },
  { kind: "link", href: "/shop", label: "Ürünler", match: (p) => p === "/shop" || p.startsWith("/shop/") },
  { kind: "link", href: "/cart", label: "Sepet", match: (p) => p.startsWith("/cart") || p.startsWith("/checkout") },
  {
    kind: "link",
    href: "/hesap",
    label: "Hesap",
    match: (p) => p.startsWith("/hesap") || p.startsWith("/orders"),
  },
];

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function iconForItem(item: DockItem) {
  if (item.kind === "search") return <IconSearch />;
  if (item.href === "/") return <IconHome />;
  if (item.href === "/shop") return <IconGrid />;
  if (item.href === "/cart") return <IconCart />;
  return <IconUser />;
}

const DOCK_QUICK_LINKS = [
  { href: "/about", label: "İletişim" },
] as const;

function DockChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("h-4 w-4 text-slate-500 transition-transform duration-200", open && "-rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteMobileDock({
  categoryNav = [],
  className,
}: {
  categoryNav?: HeaderNavCategory[];
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const [dockSubcatsOpen, setDockSubcatsOpen] = useState<Set<string>>(new Set());
  const openMiniCart = useCartStore((s) => s.openMiniCart);
  const cartCount = useCartStore(selectCartTotalQty);

  useEffect(() => {
    useCartStore.getState().hydrate();
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const toggleDockSubcats = useCallback((id: string) => {
    setDockSubcatsOpen((prev) => {
      if (prev.has(id)) return new Set();
      return new Set([id]);
    });
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) setDockSubcatsOpen(new Set());
  }, [searchOpen]);

  return (
    <>
      {searchOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[41] bg-slate-900/40 md:hidden"
            aria-label="Aramayı kapat"
            onClick={closeSearch}
          />
          <div
            className="fixed left-2 right-2 z-[42] max-h-[min(88dvh,560px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f18] p-4 shadow-2xl md:hidden"
            style={{ bottom: "max(5.5rem, calc(4.75rem + env(safe-area-inset-bottom)))" }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-100">Ürün ara</p>
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-white/8 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <Suspense
              fallback={<div className="h-24 animate-pulse rounded-xl bg-slate-100" aria-hidden />}
            >
              <SiteHeaderSearch variant="sheet" onNavigate={closeSearch} />
            </Suspense>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Kategoriler</p>
              <ul className="mt-2 max-h-[42vh] space-y-1 overflow-y-auto pr-0.5">
                {categoryNav.slice(0, 14).map((c) => {
                  const hasSubs = c.children.length > 0;
                  const expanded = dockSubcatsOpen.has(c.id);
                  return (
                    <li key={c.id} className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                      <div className="flex min-h-10 items-stretch">
                        <Link
                          href={shopCategoryHref(c.id)}
                          onClick={closeSearch}
                          className="flex min-w-0 flex-1 items-center px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          <span className="truncate">{c.name}</span>
                        </Link>
                        {hasSubs ? (
                          <button
                            type="button"
                            className="flex min-w-[3rem] shrink-0 items-center justify-center border-l border-slate-100 bg-slate-50/90 text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                            aria-expanded={expanded}
                            aria-controls={`dock-subcats-${c.id}`}
                            aria-label={
                              expanded ? `${c.name} alt koleksiyonlarını gizle` : `${c.name} alt koleksiyonlarını göster`
                            }
                            onClick={() => toggleDockSubcats(c.id)}
                          >
                            <DockChevron open={expanded} />
                          </button>
                        ) : null}
                      </div>
                      {hasSubs ? (
                        <div
                          id={`dock-subcats-${c.id}`}
                          role="region"
                          aria-label={`${c.name} alt koleksiyonları`}
                          className={cn(
                            "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                          )}
                        >
                          <div className="min-h-0 overflow-hidden border-t border-slate-100 bg-slate-50/70">
                            <div className="space-y-2 px-3 py-3">
                              <div className="flex flex-wrap items-end justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Alt koleksiyonlar
                                  </p>
                                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-900">{c.name}</p>
                                </div>
                                <Link
                                  href={shopCategoryHref(c.id)}
                                  onClick={closeSearch}
                                  className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-sky-700"
                                >
                                  Tümü →
                                </Link>
                              </div>
                              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {c.children.map((sub) => (
                                  <li key={sub.id}>
                                    <Link
                                      href={shopCategoryHref(sub.id)}
                                      onClick={closeSearch}
                                      className="flex min-h-[2.75rem] items-center rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-800 shadow-sm active:bg-slate-50"
                                    >
                                      <span className="truncate">{sub.name}</span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Hızlı erişim</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DOCK_QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeSearch}
                    className="text-xs font-semibold text-sky-700 underline-offset-2 hover:underline"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <nav
        aria-label="Mobil kısayollar"
        className={cn(
          "site-mobile-dock fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#121212]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-slate-300 shadow-[0_-8px_30px_-18px_rgba(0,0,0,0.5)] backdrop-blur-md md:hidden",
          className,
        )}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1">
          {items.map((it) => {
            const active = it.kind === "link" ? it.match(pathname) : false;
            const cls = active ? "text-sky-400" : "text-slate-500";
            const isCartDock = it.kind === "link" && it.href === "/cart";
            const inner = (
              <>
                <span
                  className={`relative grid h-9 w-9 place-items-center rounded-xl ring-1 ring-slate-200/80 ${
                    it.kind === "search" ? "bg-slate-900 text-white ring-slate-800" : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {iconForItem(it)}
                  {isCartDock && cartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-slate-900 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-[4.25rem] truncate text-[9px] font-semibold leading-tight sm:max-w-none">
                  {it.label}
                </span>
              </>
            );
            return (
              <li key={it.kind === "link" ? it.href : "search"} className="min-w-0 flex-1">
                {it.kind === "link" && it.href === "/cart" ? (
                  <button
                    type="button"
                    onClick={() => openMiniCart()}
                    className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition-colors ${cls} hover:bg-white/8 hover:text-sky-300`}
                    aria-label={cartCount > 0 ? `Sepeti aç, ${cartCount} ürün` : "Sepeti aç"}
                    aria-haspopup="dialog"
                    aria-controls="mini-cart-panel"
                  >
                    {inner}
                  </button>
                ) : it.kind === "link" ? (
                  <Link
                    href={it.href}
                    className={`flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition-colors ${cls} hover:bg-white/8 hover:text-sky-300`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex w-full flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-white/8 hover:text-sky-300"
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
