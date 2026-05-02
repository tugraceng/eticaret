"use client";

import { forwardRef, memo, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = memo(
  forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { padding?: "none" | "md" | "lg" }>(
    function Card({ className, padding = "md", ...props }, ref) {
      const pad = padding === "none" ? "" : padding === "lg" ? "p-6 sm:p-8" : "p-4 sm:p-6";
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-ds-xl border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-card",
            pad,
            className,
          )}
          {...props}
        />
      );
    },
  ),
);

Card.displayName = "Card";
