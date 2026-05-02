"use client";

import type { ReactNode } from "react";

export function DataTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`overflow-x-auto ${className}`.trim()}>{children}</div>;
}

export function DataTableShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={`min-w-full text-left text-sm ${className}`.trim()}>
      {children}
    </table>
  );
}
