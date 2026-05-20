import type { ReactNode } from "react";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";
import { cn } from "@/lib/cn";

export function LegalPage({
  kicker,
  title,
  updatedAt,
  children,
}: {
  kicker?: string;
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <PageContainer as="article" width="narrow" className="py-10 sm:py-14">
      <PageHeader
        eyebrow={kicker}
        title={title}
        description={updatedAt ? `Son güncelleme: ${updatedAt}` : undefined}
      />
      <div className={cn("si-page-card si-legal-prose fade-up mt-8 p-6 sm:p-8")}>{children}</div>
    </PageContainer>
  );
}
