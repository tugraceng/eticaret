"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
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
    ? "border-b border-slate-200/80 bg-white/85 text-slate-900 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-150"
    : "border-b border-slate-200/85 bg-white/92 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.14)] backdrop-blur-lg backdrop-saturate-150";

  const headerPosition = isHome ? "fixed inset-x-0 top-0" : "sticky top-0";

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
      className={`${headerPosition} z-50 flex flex-col transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${headerSurface}`}
    >
      {topPromoLines.length > 0 ? (
        <TopPromoMarqueeBar lines={topPromoLines} style={topPromoBarStyle} />
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl min-w-0 shrink-0 items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group relative z-20 flex min-w-0 max-w-[min(42vw,200px)] shrink-0 items-center gap-2.5 text-base font-semibold tracking-tight sm:max-w-[min(38vw,240px)] md:max-w-[280px]"
          style={{ color: "var(--brand)" }}
        >
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt={settings.siteName}
              className="h-8 w-auto max-h-8 min-h-[2rem] max-w-[120px] shrink-0 object-contain transition-transform duration-300 ease-smooth group-hover:scale-[1.03] sm:max-w-[160px]"
            />
          ) : (
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white shadow-md transition-transform duration-300 ease-spring group-hover:rotate-3 group-hover:scale-105"
              style={{ backgroundImage: "linear-gradient(145deg, var(--brand), var(--brand-2))" }}
              aria-hidden
            >
              {settings.siteName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden min-w-0 truncate text-[15px] font-semibold leading-tight text-slate-900 sm:inline">
            {settings.siteName}
          </span>
        </Link>

        <div className="relative z-10 min-w-0 flex-1 px-0 sm:px-1">
          <div className="mx-auto w-full max-w-xl min-w-0 lg:max-w-2xl">
            <Suspense
              fallback={
                <div className="hidden min-h-[2.5rem] w-full rounded-full border border-slate-100 bg-slate-50/80 md:block" aria-hidden />
              }
            >
              <SiteHeaderSearch variant="desktop" heroOverlay={false} />
            </Suspense>
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-0.5 rounded-full border border-slate-200/80 bg-slate-100/65 p-1 shadow-inner">
            <Link
              href="/favoriler"
              className="relative hidden h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-white hover:text-rose-500 sm:grid"
              aria-label="Favoriler"
            >
              <HeartIcon className="h-[1.15rem] w-[1.15rem]" />
              {wishCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white"
                  style={{ background: "var(--brand-2)" }}
                >
                  {wishCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => openMiniCart()}
              className="relative hidden h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-white hover:text-slate-900 md:grid"
              aria-label="Sepeti aç"
              aria-haspopup="dialog"
              aria-controls="mini-cart-panel"
            >
              <CartIcon className="h-[1.15rem] w-[1.15rem]" />
              {cartCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white"
                  style={{ background: "var(--brand-2)" }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {loggedIn ? (
              <Link
                href="/hesap"
                className="header-auth-solid"
              >
                Hesabım
              </Link>
            ) : (
              <>
                <Link
                  href="/hesap/giris"
                  className="header-auth-outline"
                >
                  Üye girişi
                </Link>
                <Link
                  href="/hesap/kayit"
                  className="header-auth-solid"
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

      <nav
        aria-label="Kategori ve bağlantılar"
        className="hidden shrink-0 border-t border-slate-100/90 bg-gradient-to-b from-slate-50/95 to-slate-50/25 md:block"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-x-1 gap-y-2 overflow-x-auto overscroll-x-contain px-4 py-3 text-[13px] font-medium tracking-tight sm:gap-x-2 sm:px-6 lg:px-8">
          {categoryNav.length === 0 ? (
            <Link
              href="/shop"
              className="rounded-full px-3 py-1.5 whitespace-nowrap text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
            >
              Ürünler
            </Link>
          ) : null}
          {categoryNav.map((cat) => (
            <div key={cat.id} className="group relative">
              <Link
                href={shopCategoryHref(cat.id)}
                className="inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 whitespace-nowrap text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
              >
                {cat.name}
                {cat.children.length > 0 ? (
                  <DownIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : null}
              </Link>
              {cat.children.length > 0 ? (
                <div
                  className={`invisible absolute left-0 top-[calc(100%+0.35rem)] z-50 rounded-2xl border border-slate-200/80 bg-white/95 opacity-0 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/[0.04] backdrop-blur-md transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
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
              ) : null}
            </div>
          ))}
          {tailNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 whitespace-nowrap text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-smooth ${
          open ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col border-t border-slate-200/60 bg-white/98 px-4 py-4 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.2)] backdrop-blur-lg sm:px-6">
          <Suspense fallback={null}>
            <SiteHeaderSearch variant="mobile" />
          </Suspense>
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
            {categoryNav.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Link
                  href={shopCategoryHref(cat.id)}
                  className="text-sm font-semibold text-slate-900 hover:text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={shopCategoryHref(sub.id)}
                        className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        onClick={() => setOpen(false)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
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
