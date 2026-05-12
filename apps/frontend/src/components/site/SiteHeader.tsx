"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { SiteHeaderSearch } from "@/components/site/SiteHeaderSearch";
import { shopCategoryHref, type HeaderNavCategory } from "@/lib/category-nav";
import type { SiteSettings } from "@/lib/settings";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";
import { selectCartTotalQty, useCartStore } from "@/stores/cart-store";
import { selectWishlistCount, useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/cn";

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20.8 5.4a5.5 5.5 0 0 0-7.8 0L12 6.4l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.5L21 8H6" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

function MenuIcon({ open, className = "h-5 w-5" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function DownIcon({ className = "h-3.5 w-3.5 text-slate-400" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TOP_PROMO_GAP = "w-10 md:w-16";
const topPromoLineKey = (lines: string[]) => lines.join("\0");

const TOP_PROMO_MAX_SEGMENTS = 32;

/** Admin’de logo yoksa vitrin örneği (STONEIRON3D) — `settings.logoUrl` ile her zaman geçersiz kılınabilir. */
const DEFAULT_HEADER_LOGO = "/brand/default-header-logo.png";

function TopPromoMarqueeBar({
  lines,
  style: barStyle,
}: {
  lines: string[];
  style: CSSProperties;
}) {
  const segRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [shiftPx, setShiftPx] = useState(0);
  const [viewW, setViewW] = useState(0);
  const lineKey = topPromoLineKey(lines);

  const measure = useCallback(() => {
    const el = segRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    if (w > 0) setShiftPx(Math.round(w * 1000) / 1000);
  }, []);

  const repeatCount = useMemo(() => {
    if (shiftPx <= 0) return 2;
    const w = viewW > 0 ? viewW : 0;
    if (w <= 0) return 3;
    return Math.min(
      TOP_PROMO_MAX_SEGMENTS,
      Math.max(2, Math.ceil(w / shiftPx) + 2),
    );
  }, [shiftPx, viewW]);

  useLayoutEffect(() => {
    measure();
  }, [measure, lineKey, repeatCount]);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = segRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, lineKey, repeatCount]);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined" || !viewRef.current) return;
    const el = viewRef.current;
    const set = () => {
      setViewW(el.getBoundingClientRect().width);
    };
    set();
    const ro = new ResizeObserver(() => set());
    ro.observe(el);
    return () => ro.disconnect();
  }, [lineKey]);

  useLayoutEffect(() => {
    if (typeof document === "undefined" || !document.fonts?.ready) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) requestAnimationFrame(measure);
    });
    return () => {
      cancelled = true;
    };
  }, [measure, lineKey]);

  const trackStyle = {
    ...({ "--top-promo-shift-px": `${shiftPx}px` } as CSSProperties),
  };

  return (
    <div className="hidden text-[11px] md:block" style={barStyle}>
      <div ref={viewRef} className="min-w-0 overflow-hidden px-4 py-1.5">
        <div
          className={`top-promo-track flex w-max min-w-0 ${shiftPx > 0 ? "top-promo-track--ready" : ""}`}
          style={trackStyle}
        >
          {Array.from({ length: repeatCount }, (_, copy) => (
            <div
              key={copy}
              ref={copy === 0 ? segRef : undefined}
              className="top-promo-segment flex shrink-0"
            >
              <div className="flex shrink-0 items-center gap-10 md:gap-16">
                {lines.map((p, i) => (
                  <span
                    key={`c${copy}-${i}`}
                    className="shrink-0 whitespace-nowrap opacity-90"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div
                className={`${TOP_PROMO_GAP} flex shrink-0 select-none`}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader({
  settings,
  categoryNav,
}: {
  settings: SiteSettings;
  categoryNav: HeaderNavCategory[];
}) {
  const tailNav = useMemo(
    () =>
      [
        { href: "/services", label: "3D baskı hizmeti" },
        {
          href: settings.contactNavHref?.trim() || "/contact",
          label: settings.contactNavLabel?.trim() || "Bize ulaşın",
        },
      ] as const,
    [settings.contactNavHref, settings.contactNavLabel],
  );
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const activeShopCategoryId = pathname.startsWith("/shop") ? searchParams.get("categoryId") : null;
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  /** Mobil menüde alt kategori satırları hangi kök kategoriler için açık */
  const [mobileSubcatsOpen, setMobileSubcatsOpen] = useState<Set<string>>(new Set());
  const cartCount = useCartStore(selectCartTotalQty);
  const openMiniCart = useCartStore((s) => s.openMiniCart);
  const wishCount = useWishlistStore(selectWishlistCount);
  const [loggedIn, setLoggedIn] = useState(false);

  const style = {
    "--brand": settings.primaryColor,
    "--brand-2": settings.secondaryColor,
  } as CSSProperties;

  useEffect(() => {
    useCartStore.getState().hydrate();
    useWishlistStore.getState().hydrate();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) setMobileSubcatsOpen(new Set());
  }, [open]);

  const toggleMobileSubcats = useCallback((categoryId: string) => {
    setMobileSubcatsOpen((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }, []);

  useEffect(() => {
    const readToken = () => {
      try {
        setLoggedIn(Boolean(sessionStorage.getItem(CUSTOMER_TOKEN_KEY)));
      } catch {
        setLoggedIn(false);
      }
    };
    readToken();
    const onFocus = () => readToken();
    const onVisibility = () => {
      if (document.visibilityState === "visible") readToken();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  const headerSurface = isHome
    ? "border-b border-slate-200/80 bg-white text-slate-900 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.12)]"
    : "border-b border-slate-200/90 bg-white text-slate-900 shadow-[0_6px_24px_-16px_rgba(15,23,42,0.1)]";

  const headerPosition = isHome ? "fixed inset-x-0 top-0" : "sticky top-0";

  const logoSrc = settings.logoUrl?.trim() || DEFAULT_HEADER_LOGO;
  const accent = settings.secondaryColor?.trim() || "#0ea5e9";
  const ink = settings.primaryColor?.trim() || "#0f172a";

  const topPromoLines = [
    settings.topPromoLine1,
    settings.topPromoLine2,
    settings.topPromoLine3,
  ].filter((l): l is string => Boolean(l?.trim()));
  const topPromoBg = settings.topPromoBgColor ?? "#0f172a";
  const topPromoFg = settings.topPromoTextColor ?? "#f8fafc";
  const topPromoMarqueeSec = Math.min(
    300,
    Math.max(5, Math.round(Number(settings.topPromoMarqueeDurationSec) || 50)),
  );
  const topPromoBarStyle = {
    backgroundColor: topPromoBg,
    color: topPromoFg,
    ...({ "--top-promo-marquee-duration": `${topPromoMarqueeSec}s` } as CSSProperties),
  };

  return (
    <header
      style={style}
      className={`${headerPosition} z-50 flex flex-col transition-[background-color,box-shadow] duration-300 ${headerSurface}`}
    >
      {topPromoLines.length > 0 ? (
        <TopPromoMarqueeBar lines={topPromoLines} style={topPromoBarStyle} />
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 md:flex-row md:items-center md:gap-6 md:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:contents">
          <Link
            href="/"
            className="group relative z-20 flex shrink-0 flex-col justify-center outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 focus-visible:ring-offset-2"
            aria-label={settings.siteName}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={settings.siteName}
              className="h-[2.65rem] w-auto max-w-[200px] object-contain object-left sm:h-[2.85rem] md:h-[3.15rem] md:max-w-[230px]"
            />
          </Link>

          <div className="relative z-10 hidden min-w-0 flex-1 justify-center px-2 md:flex lg:px-10">
            <div className="w-full max-w-2xl min-w-0 lg:max-w-3xl">
              <Suspense
                fallback={
                  <div className="min-h-[2.75rem] w-full rounded-xl border border-slate-200/90 bg-slate-50" aria-hidden />
                }
              >
                <SiteHeaderSearch
                  variant="desktop"
                  heroOverlay={false}
                  searchPlaceholder="Koleksiyonlarda ara…"
                />
              </Suspense>
            </div>
          </div>

          <div className="relative z-20 ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0">
            <div className="flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-slate-50/90 p-1">
              <Link
                href="/favoriler"
                className="relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-white hover:text-rose-500"
                aria-label="Favoriler"
              >
                <HeartIcon className="h-[1.15rem] w-[1.15rem]" />
                {wishCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white"
                    style={{ background: accent }}
                  >
                    {wishCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => openMiniCart()}
                className="relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                aria-label="Sepeti aç"
                aria-haspopup="dialog"
                aria-controls="mini-cart-panel"
              >
                <CartIcon className="h-[1.15rem] w-[1.15rem]" />
                {cartCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white"
                    style={{ background: accent }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden h-9 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

            <div className="hidden items-center gap-3 sm:flex">
              {loggedIn ? (
                <Link href="/hesap" className="header-auth-solid">
                  Hesabım
                </Link>
              ) : (
                <>
                  <Link
                    href="/hesap/giris"
                    className="whitespace-nowrap text-sm font-semibold underline-offset-4 transition hover:underline"
                    style={{ color: ink }}
                  >
                    Giriş yap
                  </Link>
                  <Link
                    href="/hesap/kayit"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
                    style={{ borderColor: accent, color: accent }}
                  >
                    Üye ol
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
              aria-label="Menü"
              aria-expanded={open}
            >
              <MenuIcon open={open} className="h-5 w-5 text-slate-900" />
            </button>
          </div>
        </div>

        <div className="min-w-0 md:hidden">
          <Suspense fallback={<div className="h-10 w-full rounded-xl bg-slate-50" aria-hidden />}>
            <SiteHeaderSearch variant="mobile" searchPlaceholder="Koleksiyonlarda ara…" />
          </Suspense>
        </div>
      </div>

      <nav
        aria-label="Kategori ve bağlantılar"
        className="relative z-0 hidden shrink-0 border-t border-slate-100 bg-white md:block"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-x-0.5 gap-y-0 px-4 sm:px-6 lg:px-8">
          {categoryNav.length === 0 ? (
            <Link
              href="/shop"
              className={cn(
                "border-b-2 border-transparent px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 transition-colors hover:text-slate-900",
                pathname.startsWith("/shop") && "border-sky-600 text-slate-900",
              )}
            >
              Ürünler
            </Link>
          ) : null}
          {categoryNav.map((cat) => {
            const catActive = activeShopCategoryId === cat.id;
            return (
              <div key={cat.id} className="group relative z-10">
                <Link
                  href={shopCategoryHref(cat.id)}
                  className={cn(
                    "inline-flex items-center gap-1 border-b-2 border-transparent px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:text-slate-900",
                    catActive ? "border-sky-600 text-slate-900" : "text-slate-600",
                  )}
                >
                  {cat.name}
                  {cat.children.length > 0 ? (
                    <DownIcon className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  ) : null}
                </Link>
              {cat.children.length > 0 ? (
                <div
                  className="invisible absolute left-0 top-full z-50 pt-1.5 opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  <div
                    className={`rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/[0.04] backdrop-blur-md ${
                      cat.children.length > 4
                        ? "grid min-w-[min(100vw-2rem,520px)] max-w-[90vw] grid-cols-2 gap-0.5 p-3 sm:grid-cols-2"
                        : "min-w-[220px] p-2"
                    }`}
                  >
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={shopCategoryHref(sub.id)}
                        className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            );
          })}
          {tailNav.map((item) => {
            const muted = item.href === "/services";
            const tailActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 border-transparent px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:text-slate-900",
                  muted && !tailActive ? "text-slate-400" : "text-slate-600",
                  tailActive && "border-sky-600 text-slate-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-smooth ${
          open ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col border-t border-slate-200/60 bg-white/98 px-4 py-4 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.2)] backdrop-blur-lg sm:px-6">
          <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto pr-1">
            {categoryNav.length === 0 ? (
              <Link
                href="/shop"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Ürünler
              </Link>
            ) : null}
            {categoryNav.map((cat) => {
              const hasSubs = cat.children.length > 0;
              const subsExpanded = mobileSubcatsOpen.has(cat.id);
              return (
                <div key={cat.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex min-h-[2.75rem] items-stretch">
                    <Link
                      href={shopCategoryHref(cat.id)}
                      className="flex flex-1 items-center px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 hover:text-slate-700"
                      onClick={() => setOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {hasSubs ? (
                      <button
                        type="button"
                        className="flex w-12 shrink-0 items-center justify-center border-l border-slate-100 bg-slate-50/90 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-expanded={subsExpanded}
                        aria-controls={`mobile-subcats-${cat.id}`}
                        aria-label={subsExpanded ? `${cat.name} alt kategorilerini gizle` : `${cat.name} alt kategorilerini göster`}
                        onClick={() => toggleMobileSubcats(cat.id)}
                      >
                        <DownIcon
                          className={cn(
                            "h-4 w-4 text-slate-500 transition-transform duration-200",
                            subsExpanded && "-rotate-180",
                          )}
                        />
                      </button>
                    ) : null}
                  </div>
                  {hasSubs ? (
                    <div
                      id={`mobile-subcats-${cat.id}`}
                      role="region"
                      aria-label={`${cat.name} alt kategorileri`}
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                        subsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.id}
                              href={shopCategoryHref(sub.id)}
                              className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              onClick={() => setOpen(false)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-2">
              {tailNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
