"use client";

import type { ReactNode } from "react";

export function AdminCard({
  title,
  description,
  actions,
  children,
  tone = "default",
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  tone?: "default" | "warning";
  className?: string;
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200/70 bg-amber-50/80"
      : "border-slate-200/70 bg-white";
  return (
    <section
      className={`rounded-3xl border ${toneClass} p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6 ${className}`}
    >
      {(title || description || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </label>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "slate" | "sky" | "emerald" | "violet" | "rose" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "from-slate-900 to-slate-700",
    sky: "from-sky-600 to-cyan-500",
    emerald: "from-emerald-600 to-teal-500",
    violet: "from-violet-600 to-indigo-500",
    rose: "from-rose-500 to-pink-500",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <div className="card-soft flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <p className="mt-2 truncate text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {icon && (
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-inner`}
          aria-hidden
        >
          {icon}
        </span>
      )}
    </div>
  );
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

export function StatusBadge({ status }: { status: string }) {
  const cls =
    {
      PENDING: "bg-amber-100 text-amber-800",
      PAID: "bg-sky-100 text-sky-800",
      PROCESSING: "bg-indigo-100 text-indigo-800",
      SHIPPED: "bg-violet-100 text-violet-800",
      DELIVERED: "bg-emerald-100 text-emerald-800",
      CANCELLED: "bg-rose-100 text-rose-800",
    }[status] ?? "bg-slate-100 text-slate-700";
  const label = ORDER_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

export function Toast({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const cls =
    kind === "error"
      ? "bg-rose-50 text-rose-800 ring-rose-200"
      : "bg-emerald-50 text-emerald-800 ring-emerald-200";
  const icon = kind === "error" ? "⚠" : "✓";
  return (
    <div
      className={`fade-in flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${cls}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span aria-hidden className="mt-0.5 text-base leading-none">
        {icon}
      </span>
      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
}

type IconProps = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icon = {
  Dashboard: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M3 13h7V3H3zM14 21h7V11h-7zM3 21h7v-5H3zM14 8h7V3h-7z" />
    </svg>
  ),
  Home: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  Settings: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  Folder: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Box: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v9l9 5 9-5V8" />
      <path d="M12 13v9" />
    </svg>
  ),
  Doc: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  Bag: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M6 7h12l-1 13H7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  ),
  Bell: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  Users: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <circle cx="17" cy="9" r="3" />
      <path d="M22 21a5 5 0 0 0-8-4" />
    </svg>
  ),
  Logout: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  ),
  Plus: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  ArrowUp: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M12 5v14" />
      <path d="M5 12l7 7 7-7" />
    </svg>
  ),
  Trash: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  Pencil: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
    </svg>
  ),
  Eye: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A11 11 0 0 1 23 12c-.9 1.6-2.1 3-3.6 4.1M6.6 6.6C3.6 8.3 1.8 10.6 1 12c1.4 2.6 5.3 7 11 7 1.7 0 3.3-.3 4.8-.9" />
    </svg>
  ),
  Check: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  X: ({ className = "h-4 w-4" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Card: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  ),
  Truck: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M14 18V6H4v12h2" />
      <path d="M14 18h6l2-4v-4h-4" />
      <circle cx="8" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M14 10h4" />
    </svg>
  ),
  Layers: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Undo: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  ),
  Tag: ({ className = "h-5 w-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} className={className} aria-hidden>
      <path d="M3 5v6l9 9 9-9-9-9H3z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
};
