"use client";

import { memo, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--ds-surface-muted)] text-[var(--ds-text)] ring-1 ring-[var(--ds-border)]",
  success:
    "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  accent: "bg-sky-50 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100",
};

export const Badge = memo(function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-micro uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
});
