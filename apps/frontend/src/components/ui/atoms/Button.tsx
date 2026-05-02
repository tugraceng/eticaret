"use client";

import { forwardRef, memo, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ds-surface-inverse)] text-[var(--ds-surface)] shadow-sm hover:opacity-95 active:scale-[0.98]",
  secondary:
    "border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] text-[var(--ds-text)] hover:bg-[var(--ds-surface)]",
  ghost:
    "border border-[var(--ds-border)] bg-transparent text-[var(--ds-text)] hover:bg-[var(--ds-surface-muted)]",
  danger: "bg-[var(--ds-color-error)] text-white hover:opacity-95 active:scale-[0.98]",
};

export const Button = memo(
  forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: ButtonVariant;
      size?: "md" | "lg" | "icon";
    }
  >(function Button({ className, variant = "primary", size = "md", type = "button", ...props }, ref) {
    const sizeCls =
      size === "lg"
        ? "min-h-[48px] px-6 py-3 text-small font-semibold"
        : size === "icon"
          ? "h-11 w-11 p-0"
          : "min-h-11 px-5 py-2.5 text-small font-semibold";
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-ds-xl transition-[transform,opacity,background-color] duration-200 ease-smooth disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizeCls,
          className,
        )}
        {...props}
      />
    );
  }),
);

Button.displayName = "Button";
