"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

const variants = {
  primary: "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50",
  ghost:
    "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger: "rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50",
  subtle: "rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40",
} as const;

export const AdminButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }
>(function AdminButton({ className = "", variant = "primary", type = "button", ...rest }, ref) {
  return <button ref={ref} type={type} className={`${variants[variant]} ${className}`.trim()} {...rest} />;
});
