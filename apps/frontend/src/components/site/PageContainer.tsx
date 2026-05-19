import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { headingClass, sectionSpacing, siteContainerClass } from "@/lib/design-system";

export { siteContainerClass };

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
        sectionSpacing.default,
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
        <p className={headingClass.eyebrow}>{eyebrow}</p>
      ) : null}
      <h1 className={cn("mt-2", headingClass.h1)}>
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
      ) : null}
    </header>
  );
}
