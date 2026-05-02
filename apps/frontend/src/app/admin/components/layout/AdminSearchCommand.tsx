"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../ui";
import { flattenAdminNav, type AdminNavGroup } from "../../config/nav";

export function AdminSearchCommand({
  groups,
  open,
  onOpenChange,
}: {
  groups: readonly AdminNavGroup[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const flat = useMemo(() => flattenAdminNav(groups), [groups]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return flat;
    return flat.filter(
      (n) =>
        n.label.toLowerCase().includes(t) ||
        n.hint.toLowerCase().includes(t) ||
        n.id.includes(t),
    );
  }, [flat, q]);

  const onPick = useCallback(() => {
    onOpenChange(false);
    setQ("");
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/50 p-4 pt-[12vh] backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        aria-label="Hızlı git"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <Icon.Doc className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
            placeholder="Sayfa ara… (Ctrl+K)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Esc
          </button>
        </div>
        <ul className="max-h-[min(50vh,360px)] overflow-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500">Sonuç yok.</li>
          ) : (
            filtered.map((n) => {
              const Ic = n.icon;
              const href = n.id === "overview" ? "/admin" : `/admin/${n.id}`;
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    onClick={onPick}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <Ic className="h-4 w-4 shrink-0 text-slate-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900">{n.label}</span>
                      <span className="block truncate text-xs text-slate-500">{n.hint}</span>
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
