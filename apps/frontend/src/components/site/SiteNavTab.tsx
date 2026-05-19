import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Üst menü sekmesi — aktif çizgi ikon/metin genişliğini aşmaz. */
export function SiteNavTab({
  href,
  active,
  muted,
  children,
  onMouseEnter,
  onClick,
  className,
}: {
  href: string;
  active?: boolean;
  muted?: boolean;
  children: ReactNode;
  onMouseEnter?: () => void;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div className="relative flex shrink-0 items-stretch">
      <Link
        href={href}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:text-slate-900",
          muted && !active ? "text-slate-400" : "text-slate-600",
          active && "text-slate-900",
          className,
        )}
      >
        {children}
      </Link>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-sky-600 transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
    </div>
  );
}
