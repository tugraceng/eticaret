"use client";

import { forwardRef, memo, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = memo(
  forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
    function Input({ className, invalid, ...props }, ref) {
      return (
        <input
          ref={ref}
          className={cn(
            "min-h-11 w-full rounded-ds-lg border bg-[var(--ds-surface)] px-4 py-2.5 text-body text-[var(--ds-text)] shadow-sm placeholder:text-[var(--ds-text-muted)] transition-[border-color,box-shadow]",
            invalid
              ? "border-[var(--ds-color-error)] ring-2 ring-[var(--ds-color-error)]/20"
              : "border-[var(--ds-border)] focus:border-[var(--ds-color-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--ds-color-secondary)]/15",
            className,
          )}
          {...props}
        />
      );
    },
  ),
);

Input.displayName = "Input";
