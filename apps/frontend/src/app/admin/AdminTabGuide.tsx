"use client";

import type { Tab } from "./tabs";
import { ADMIN_TAB_GUIDE } from "./tab-guide";

export function AdminTabGuide({ tab }: { tab: Tab }) {
  const g = ADMIN_TAB_GUIDE[tab];
  if (!g) return null;
  return (
    <aside
      className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/90 to-white px-4 py-3 text-sm shadow-sm sm:px-5 sm:py-4"
      aria-label="Bu sayfa hakkında"
    >
      <p className="font-semibold text-slate-900">{g.title}</p>
      <p className="mt-1.5 leading-relaxed text-slate-600">{g.body}</p>
    </aside>
  );
}
