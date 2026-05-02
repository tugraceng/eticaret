import type { ReactNode } from "react";

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
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header className="fade-up">
        {kicker && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {kicker}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {updatedAt && (
          <p className="mt-2 text-xs text-slate-500">Son güncelleme: {updatedAt}</p>
        )}
      </header>
      <div className="prose prose-slate mt-8 max-w-none text-sm leading-relaxed text-slate-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:text-slate-500 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1">
        {children}
      </div>
    </article>
  );
}
