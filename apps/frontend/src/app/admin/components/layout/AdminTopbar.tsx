"use client";

import Link from "next/link";
import { AdminQuickActions } from "../AdminQuickActions";
import { Icon } from "../../ui";

export function AdminTopbar({
  title,
  onOpenMobileMenu,
  onOpenSearch,
  unreadNotifs,
  onNotifications,
  onLogout,
  onGoProducts,
  onGoCategories,
  onGoOrders,
}: {
  title: string;
  onOpenMobileMenu: () => void;
  onOpenSearch?: () => void;
  unreadNotifs: number;
  onNotifications: () => void;
  onLogout: () => void;
  onGoProducts: () => void;
  onGoCategories: () => void;
  onGoOrders: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="space-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Menü"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Yönetim paneli
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
          </div>
          {onOpenSearch ? (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex"
              title="Hızlı git (Ctrl+K)"
            >
              Ara <span className="font-mono text-[10px] text-slate-400">⌘K</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNotifications}
            className="relative grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100"
            aria-label="Bildirimler"
          >
            <Icon.Bell />
            {unreadNotifs > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unreadNotifs}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
          >
            <Icon.Logout />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
        <AdminQuickActions onGoProducts={onGoProducts} onGoCategories={onGoCategories} onGoOrders={onGoOrders} />
      </div>
    </header>
  );
}

export function AdminDesktopSidebarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-900/50 bg-slate-950 text-slate-200 md:flex">
      {children}
    </aside>
  );
}

export function AdminSidebarBrand() {
  return (
    <div className="border-b border-white/5 px-5 py-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg"
        >
          <Icon.Dashboard className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">Yönetim</p>
          <p className="text-sm font-semibold text-white">Mağaza paneli</p>
          <p className="mt-1 max-w-[11rem] text-[10px] leading-snug text-slate-500">
            Soldan bölüm seçin. Menü öğesinin üzerine gelince kısa açıklama görünür.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebarFooter() {
  return (
    <div className="border-t border-white/5 p-3">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
      >
        <span aria-hidden>←</span> Siteye dön
      </Link>
    </div>
  );
}
