import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Header / footer ile aynı yatay hiza (max-width + padding). */
export const siteContainerClass =
  "mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8";

type Props = {
  children: ReactNode;
  className?: string;
  /** content: standart vitrin; narrow: blog/yasal metin */
  width?: "content" | "narrow";
  as?: "div" | "main" | "article" | "section";
};

/** Tüm vitrin sayfalarında yatay hizayı header ile eşitler. */
export function PageContainer({
  children,
  className,
  width = "content",
  as: Tag = "div",
}: Props) {
  return (
    <Tag
      className={cn(
        siteContainerClass,
        width === "narrow" ? "max-w-3xl" : undefined,
        "py-12 sm:py-14",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("fade-up max-w-3xl", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
      ) : null}
    </header>
  );
}
