"use client";

import type { ReactNode } from "react";

export function AdminModal({
  open,
  title,
  children,
  footer,
  onClose,
  size = "md",
}: {
  open: boolean;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;
  const w = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Kapat" onClick={onClose} />
      <div
        className={`relative w-full ${w} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`}
        role="dialog"
        aria-modal
      >
        {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : null}
        <div className={title ? "mt-4" : ""}>{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
