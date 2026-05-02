"use client";

import Link from "next/link";
import type { Tab } from "../../tabs";
import type { AdminCounters } from "../../types";
import type { AdminNavGroup } from "../../config/nav";

export function AdminSidebar({
  groups,
  activeTab,
  counters,
  unreadNotifs,
  onItemClick,
}: {
  groups: readonly AdminNavGroup[];
  activeTab: Tab;
  counters: AdminCounters;
  unreadNotifs: number;
  onItemClick?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.title} className="mt-5 first:mt-0">
          <p className="mb-0.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {group.title}
          </p>
          {group.subtitle ? (
            <p className="mb-2 px-3 text-[10px] leading-snug text-slate-500/80">{group.subtitle}</p>
          ) : null}
          <div className="flex flex-col gap-1">
            {group.items.map((n) => {
              const IconC = n.icon;
              const active = activeTab === n.id;
              const badge =
                n.id === "notifications" && unreadNotifs > 0
                  ? unreadNotifs
                  : n.id === "reviews" && counters.pendingReviews > 0
                    ? counters.pendingReviews
                    : n.id === "returns" && counters.pendingReturns > 0
                      ? counters.pendingReturns
                      : n.id === "stock" && counters.lowStock > 0
                        ? counters.lowStock
                        : null;
              return (
                <Link
                  key={n.id}
                  href={n.id === "overview" ? "/admin" : `/admin/${n.id}`}
                  title={n.hint}
                  onClick={() => onItemClick?.()}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth ${
                    active
                      ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-400"
                      aria-hidden
                    />
                  )}
                  <IconC className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-left">{n.label}</span>
                  {badge !== null && (
                    <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
