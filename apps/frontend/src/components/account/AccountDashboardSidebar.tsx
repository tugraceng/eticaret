import Link from "next/link";
import type { AccountTabId } from "./account-tab-ids";

const nav: { id: AccountTabId; label: string; icon: "grid" | "orders" | "user" | "pin" | "return" | "key" }[] = [
  { id: "overview", label: "Özet", icon: "grid" },
  { id: "orders", label: "Siparişlerim", icon: "orders" },
  { id: "profile", label: "Profil", icon: "user" },
  { id: "addresses", label: "Adreslerim", icon: "pin" },
  { id: "returns", label: "İadelerim", icon: "return" },
  { id: "password", label: "Şifre", icon: "key" },
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: (typeof nav)[number]["icon"];
  className?: string;
}) {
  switch (name) {
    case "grid":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "orders":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 6h15l-1.5 9h-12L6 6z" />
          <path d="M6 6L5 3H2" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
      );
    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "pin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 21s7-4.5 7-10a7 7 0 0 0-14 0c0 5.5 7 10 7 10z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      );
    case "return":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      );
    case "key":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="7.5" cy="15.5" r="3.5" />
          <path d="M10.5 12.5L21 3" />
          <path d="M18 6l2 2" />
        </svg>
      );
    default:
      return null;
  }
}

export function AccountDashboardSidebar({
  active,
  onSelect,
  onLogout,
}: {
  active: AccountTabId;
  onSelect: (id: AccountTabId) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="flex w-full flex-col gap-1 lg:max-w-[220px] lg:shrink-0">
      <p className="mb-2 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 lg:block">Hesap</p>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {nav.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200/80"
              }`}
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
        <Link
          href="/favoriler"
          className="flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M20.8 5.4a5.5 5.5 0 0 0-7.8 0L12 6.4l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
          Favoriler
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex flex-shrink-0 items-center gap-2 rounded-full bg-rose-50/80 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200/80"
        >
          Çıkış
        </button>
      </div>

      <nav className="hidden space-y-1 lg:block">
        {nav.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-400"}>
                <Icon name={item.icon} />
              </span>
              {item.label}
            </button>
          );
        })}

        <Link
          href="/favoriler"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          <span className="text-rose-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M20.8 5.4a5.5 5.5 0 0 0-7.8 0L12 6.4l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </span>
          Favoriler
        </Link>

        <div className="my-2 border-t border-slate-200/80" />

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Çıkış
        </button>
      </nav>
    </aside>
  );
}
