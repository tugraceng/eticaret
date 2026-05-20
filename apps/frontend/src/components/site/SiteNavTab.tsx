import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Üst menü sekmesi — aktif çizgi nav alt border ile hizalı kalır. */
export function SiteNavTab({
  href,
  active,
  muted,
  children,
  onMouseEnter,
  onClick,
  className,
  compact,
}: {
  href: string;
  active?: boolean;
  muted?: boolean;
  children: ReactNode;
  onMouseEnter?: () => void;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className="relative flex shrink-0 items-stretch">
      <Link
        href={href}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={cn(
          "si-nav-tab inline-flex items-center gap-1 px-3.5 text-[0.8125rem] font-semibold tracking-[0.04em] transition-colors hover:text-white",
          compact ? "py-2.5" : "py-3.5",
          muted && !active ? "text-slate-500" : "text-slate-300",
          active && "text-white",
          className,
        )}
      >
        {children}
      </Link>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-white/90 transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
    </div>
  );
}
