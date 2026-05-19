import type { ReactNode } from "react";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";

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
    <PageContainer as="article" width="narrow" className="py-12 sm:py-16">
      <PageHeader eyebrow={kicker} title={title} description={updatedAt ? `Son güncelleme: ${updatedAt}` : undefined} />
      <div className="prose prose-slate fade-up mt-8 max-w-none text-sm leading-relaxed text-slate-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:text-slate-500 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1">
        {children}
      </div>
    </PageContainer>
  );
}
