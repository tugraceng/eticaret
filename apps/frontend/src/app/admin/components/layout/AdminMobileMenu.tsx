"use client";

import { Icon } from "../../ui";
import { AdminSidebar } from "./AdminSidebar";
import type { Tab } from "../../tabs";
import type { AdminCounters } from "../../types";
import type { AdminNavGroup } from "../../config/nav";

export function AdminMobileMenu({
  open,
  onClose,
  groups,
  activeTab,
  counters,
  unreadNotifs,
}: {
  open: boolean;
  onClose: () => void;
  groups: readonly AdminNavGroup[];
  activeTab: Tab;
  counters: AdminCounters;
  unreadNotifs: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-72 flex-col bg-slate-950 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
              <Icon.Dashboard className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-white">Mağaza paneli</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Kapat"
          >
            <Icon.X />
          </button>
        </div>
        <AdminSidebar
          groups={groups}
          activeTab={activeTab}
          counters={counters}
          unreadNotifs={unreadNotifs}
          onItemClick={onClose}
        />
      </aside>
    </div>
  );
}
