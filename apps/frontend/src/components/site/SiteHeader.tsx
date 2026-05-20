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
import { CategoryMegaMenu } from "@/components/site/CategoryMegaMenu";
import { MobileSiteNavDrawer } from "@/components/site/MobileSiteNavDrawer";
import { SiteNavTab } from "@/components/site/SiteNavTab";
import { shopCategoryHref, type HeaderNavCategory } from "@/lib/category-nav";
import { parseHeaderNav, type HeaderNavLink } from "@/lib/header-nav";
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

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
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
    <div className="block text-[10px] leading-snug sm:text-[11px]" style={barStyle}>
      <div ref={viewRef} className="min-w-0 overflow-hidden px-3 py-1.5 sm:px-4">
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
  const pathname = usePathname() ?? "/";
  const headerNav = useMemo(() => parseHeaderNav(settings.headerNav), [settings.headerNav]);
  const contactNavItem = useMemo(
    (): HeaderNavLink => ({
      href: settings.contactNavHref?.trim() || "/contact",
      label: settings.contactNavLabel?.trim() || "Bize ulaşın",
      muted: false,
    }),
    [settings.contactNavHref, settings.contactNavLabel],
  );
  const contactNavActive =
    pathname === contactNavItem.href ||
    (contactNavItem.href.startsWith("/") && pathname.startsWith(`${contactNavItem.href}/`));
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
  /** Masaüstü: alt kategorili kök üzerindeyken tam genişlik mega panel */
  const [megaCategoryId, setMegaCategoryId] = useState<string | null>(null);
  const [headerCompact, setHeaderCompact] = useState(false);
  const megaCloseTimerRef = useRef<number | null>(null);

  const clearMegaCloseTimer = useCallback(() => {
    if (megaCloseTimerRef.current != null) {
      window.clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
  }, []);

  const scheduleMegaClose = useCallback(() => {
    clearMegaCloseTimer();
    megaCloseTimerRef.current = window.setTimeout(() => {
      setMegaCategoryId(null);
      megaCloseTimerRef.current = null;
    }, 160);
  }, [clearMegaCloseTimer]);

  const openMegaCategory = useCallback(
    (id: string) => {
      clearMegaCloseTimer();
      setMegaCategoryId(id);
    },
    [clearMegaCloseTimer],
  );

  const collapseMega = useCallback(() => {
    clearMegaCloseTimer();
    setMegaCategoryId(null);
  }, [clearMegaCloseTimer]);

  const megaCategory = useMemo(
    () => categoryNav.find((c) => c.id === megaCategoryId && c.children.length > 0),
    [categoryNav, megaCategoryId],
  );

  const style = {
    "--brand": settings.primaryColor,
    "--brand-2": settings.secondaryColor,
  } as CSSProperties;

  useEffect(() => {
    useCartStore.getState().hydrate();
    useWishlistStore.getState().hydrate();
  }, []);

  useEffect(() => {
    const onScroll = () => setHeaderCompact(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    collapseMega();
  }, [pathname, collapseMega]);

  useEffect(() => {
    if (!open) setMobileSubcatsOpen(new Set());
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    return () => clearMegaCloseTimer();
  }, [clearMegaCloseTimer]);

  const toggleMobileSubcats = useCallback((categoryId: string) => {
    setMobileSubcatsOpen((prev) => {
      if (prev.has(categoryId)) return new Set();
      return new Set([categoryId]);
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

  const headerSurface = cn(
    "si-header border-b border-white/[0.08] bg-[#121212]/82 text-slate-100 backdrop-blur-md backdrop-saturate-150 transition-[box-shadow,padding,background-color] duration-300",
    headerCompact
      ? "shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]"
      : isHome
        ? "shadow-[0_8px_32px_-18px_rgba(0,0,0,0.45)]"
        : "shadow-[0_6px_28px_-16px_rgba(0,0,0,0.4)]",
  );

  const headerPosition = isHome ? "fixed inset-x-0 top-0" : "sticky top-0";

  const logoSrc = settings.logoUrl?.trim() || DEFAULT_HEADER_LOGO;
  const accent = settings.secondaryColor?.trim() || "#0ea5e9";

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
      data-compact={headerCompact ? "" : undefined}
      className={cn(headerPosition, "z-50 flex flex-col", headerSurface)}
    >
      {topPromoLines.length > 0 ? (
        <TopPromoMarqueeBar lines={topPromoLines} style={topPromoBarStyle} />
      ) : null}

      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-3 px-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:gap-6 transition-[padding] duration-300",
          headerCompact ? "py-2 md:py-2" : "py-3 md:py-3.5",
        )}
      >
        {/* Mobil: hamburger — logo ortada — sepet + hesap */}
        <div className="relative z-[62] flex min-h-[3rem] w-full items-center justify-between md:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="si-mobile-menu-btn relative z-[62] grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-slate-200"
            aria-label="Menü"
            aria-expanded={open}
          >
            <MenuIcon open={open} className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="absolute left-1/2 z-20 -translate-x-1/2 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            onClick={() => setOpen(false)}
          >
            {settings.siteName}
          </Link>
          <div className="relative z-20 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => openMiniCart()}
              className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-300 hover:bg-white/8 hover:text-white"
              aria-label="Sepeti aç"
            >
              <CartIcon className="h-5 w-5" />
              {cartCount > 0 ? (
                <span
                  className="absolute right-1 top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                  style={{ background: accent }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </button>
            <Link
              href={loggedIn ? "/hesap" : "/hesap/giris"}
              className="grid h-11 w-11 place-items-center rounded-xl text-slate-300 hover:bg-white/8 hover:text-white"
              aria-label={loggedIn ? "Hesabım" : "Giriş yap"}
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
          <Link
            href="/"
            className="relative z-20 flex shrink-0 flex-col justify-center outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 focus-visible:ring-offset-2"
            aria-label={settings.siteName}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={settings.siteName}
              className={cn(
                "w-auto object-contain object-left transition-[height,max-height] duration-300",
                headerCompact
                  ? "h-14 max-h-[4rem] max-w-[min(72vw,360px)] sm:h-16 sm:max-w-[400px] md:h-[4.25rem] md:max-w-[440px]"
                  : "h-16 max-h-[4.5rem] max-w-[min(72vw,360px)] sm:h-[4.25rem] sm:max-w-[400px] md:h-[4.5rem] md:max-w-[440px] lg:h-[4.75rem] lg:max-w-[460px]",
              )}
            />
          </Link>

          <div className="relative z-10 hidden min-w-0 flex-1 justify-center px-2 md:flex lg:px-10">
            <div className="w-full max-w-2xl min-w-0 lg:max-w-3xl">
              <Suspense
                fallback={
                  <div className="min-h-[2.75rem] w-full rounded-xl border border-white/10 bg-white/5" aria-hidden />
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
            <div className="si-header-actions hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 md:flex">
              <Link
                href="/favoriler"
                className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/8 hover:text-rose-400"
                aria-label="Favoriler"
              >
                <HeartIcon className="h-5 w-5" />
                {wishCount > 0 && (
                  <span
                    className="absolute right-0 top-0 inline-flex min-h-[1.125rem] min-w-[1.125rem] translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white"
                    style={{ background: accent }}
                  >
                    {wishCount > 99 ? "99+" : wishCount}
                  </span>
                )}
              </Link>
              <span className="w-px self-stretch bg-white/10" aria-hidden />
              <button
                type="button"
                onClick={() => openMiniCart()}
                className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
                aria-label="Sepeti aç"
                aria-haspopup="dialog"
                aria-controls="mini-cart-panel"
              >
                <CartIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span
                    className="absolute right-0 top-0 inline-flex min-h-[1.125rem] min-w-[1.125rem] translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white"
                    style={{ background: accent }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden h-10 w-px shrink-0 bg-white/10 sm:block" aria-hidden />

            <div className="hidden items-center gap-2 sm:flex">
              {loggedIn ? (
                <Link href="/hesap" className="header-auth-solid">
                  Hesabım
                </Link>
              ) : (
                <>
                  <Link href="/hesap/giris" className="header-auth-outline">
                    Giriş yap
                  </Link>
                  <Link href="/hesap/kayit" className="header-auth-solid">
                    Üye ol
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      <nav
        aria-label="Kategori ve bağlantılar"
        className="si-header-nav relative z-0 hidden shrink-0 border-t border-white/[0.06] bg-[#0a0f18]/95 md:block"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-x-0.5 gap-y-0 px-4 sm:px-6 lg:px-8">
          {headerNav.beforeCategories.map((item) => {
            const isInternal = item.href.startsWith("/");
            const tailActive =
              pathname === item.href || (isInternal && pathname.startsWith(`${item.href}/`));
            return (
              <SiteNavTab
                key={`before-${item.href}-${item.label}`}
                href={item.href}
                active={tailActive}
                muted={item.muted}
                compact={headerCompact}
                onMouseEnter={collapseMega}
              >
                {item.label}
              </SiteNavTab>
            );
          })}
          {categoryNav.length === 0 ? (
            <SiteNavTab
              href="/shop"
              active={pathname.startsWith("/shop")}
              compact={headerCompact}
              onMouseEnter={collapseMega}
            >
              Ürünler
            </SiteNavTab>
          ) : null}
          {categoryNav.map((cat) => {
            const catActive = activeShopCategoryId === cat.id;
            const megaOpen = megaCategoryId === cat.id && cat.children.length > 0;
            return (
              <div
                key={cat.id}
                className="group relative z-10"
                onMouseEnter={() => {
                  if (cat.children.length > 0) openMegaCategory(cat.id);
                  else collapseMega();
                }}
              >
                <SiteNavTab
                  href={shopCategoryHref(cat.id)}
                  active={catActive || megaOpen}
                  compact={headerCompact}
                  onMouseEnter={() => {
                    if (cat.children.length > 0) openMegaCategory(cat.id);
                    else collapseMega();
                  }}
                >
                  {cat.name}
                  {cat.children.length > 0 ? (
                    <DownIcon
                      className={cn(
                        "h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ease-out",
                        megaOpen ? "-rotate-180 text-sky-400" : "group-hover:text-sky-300",
                      )}
                    />
                  ) : null}
                </SiteNavTab>
              </div>
            );
          })}
          {headerNav.afterCategories.map((item) => {
            const isInternal = item.href.startsWith("/");
            const tailActive =
              pathname === item.href || (isInternal && pathname.startsWith(`${item.href}/`));
            return (
              <SiteNavTab
                key={`after-${item.href}-${item.label}`}
                href={item.href}
                active={tailActive}
                muted={item.muted}
                compact={headerCompact}
                onMouseEnter={collapseMega}
              >
                {item.label}
              </SiteNavTab>
            );
          })}
          <SiteNavTab
            href={contactNavItem.href}
            active={contactNavActive}
            compact={headerCompact}
            onMouseEnter={collapseMega}
          >
            {contactNavItem.label}
          </SiteNavTab>
        </div>

        {megaCategory ? (
          <CategoryMegaMenu
            categories={categoryNav}
            activeCategory={megaCategory}
            activeCategoryId={megaCategoryId ?? megaCategory.id}
            onHoverCategory={openMegaCategory}
            onMouseEnterPanel={clearMegaCloseTimer}
            onMouseLeavePanel={scheduleMegaClose}
          />
        ) : null}
      </nav>

      <MobileSiteNavDrawer open={open} onClose={() => setOpen(false)}>
            <Link
              href="/shop"
              className="rounded-lg px-3 py-3 font-[family-name:var(--font-playfair)] text-lg text-slate-100 hover:bg-white/6"
              onClick={() => setOpen(false)}
            >
              Ürünler
            </Link>
            <Link
              href="/services"
              className="rounded-lg px-3 py-3 font-[family-name:var(--font-playfair)] text-lg text-slate-100 hover:bg-white/6"
              onClick={() => setOpen(false)}
            >
              Hizmetler
            </Link>
            {headerNav.beforeCategories.map((item) => (
              <Link
                key={`mob-before-${item.href}-${item.label}`}
                href={item.href}
                className="rounded-lg px-3 py-3 font-[family-name:var(--font-playfair)] text-lg text-slate-100 hover:bg-white/6"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {categoryNav.length === 0 ? null : (
              <p className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Kategoriler
              </p>
            )}
            {categoryNav.map((cat) => {
              const hasSubs = cat.children.length > 0;
              const subsExpanded = mobileSubcatsOpen.has(cat.id);
              return (
                <div key={cat.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#121a28] shadow-sm">
                  <div className="flex min-h-[2.75rem] items-stretch">
                    <Link
                      href={shopCategoryHref(cat.id)}
                      className="flex flex-1 items-center px-3 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/6"
                      onClick={() => setOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {hasSubs ? (
                      <button
                        type="button"
                        className="flex min-w-[3rem] shrink-0 items-center justify-center border-l border-white/8 bg-white/[0.04] text-slate-400 hover:bg-white/8 hover:text-slate-100"
                        aria-expanded={subsExpanded}
                        aria-controls={`mobile-subcats-${cat.id}`}
                        aria-label={subsExpanded ? `${cat.name} alt koleksiyonlarını gizle` : `${cat.name} alt koleksiyonlarını göster`}
                        onClick={() => toggleMobileSubcats(cat.id)}
                      >
                        <DownIcon
                          className={cn(
                            "h-4 w-4 text-slate-400 transition-transform duration-200",
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
                      aria-label={`${cat.name} alt koleksiyonları`}
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                        subsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="min-h-0 overflow-hidden border-t border-white/8 bg-[#0c111b]/90">
                        <div className="space-y-3 px-3 py-4">
                          <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Kategori
                              </p>
                              <p className="mt-0.5 truncate text-base font-semibold tracking-tight text-white">
                                {cat.name}
                              </p>
                            </div>
                            <Link
                              href={shopCategoryHref(cat.id)}
                              className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-sky-400 active:text-sky-300"
                              onClick={() => setOpen(false)}
                            >
                              Tümünü gör →
                            </Link>
                          </div>
                          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {cat.children.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={shopCategoryHref(sub.id)}
                                  className="flex min-h-[3rem] items-center rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-slate-200 active:bg-white/8"
                                  onClick={() => setOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {[...headerNav.afterCategories, contactNavItem].map((item) => (
              <Link
                key={`mob-tail-${item.href}-${item.label}`}
                href={item.href}
                className="rounded-lg px-3 py-3 font-[family-name:var(--font-playfair)] text-lg text-slate-100 hover:bg-white/6"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
      </MobileSiteNavDrawer>
    </header>
  );
}
