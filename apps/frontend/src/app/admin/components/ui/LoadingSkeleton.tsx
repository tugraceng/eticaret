"use client";

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 ${className}`.trim()}
      aria-hidden
    />
  );
}
