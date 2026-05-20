import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { sectionSpacing, siteContainerClass } from "@/lib/design-system";

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
      {eyebrow ? <p className="si-kicker">{eyebrow}</p> : null}
      <h1 className="si-heading mt-2">{title}</h1>
      {description ? <p className="si-body mt-4 max-w-2xl">{description}</p> : null}
    </header>
  );
}
