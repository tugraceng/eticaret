"use client";

import type { ReactNode } from "react";
import { AdminTabGuide } from "../../AdminTabGuide";
import { Toast } from "../../ui";
import type { Tab } from "../../tabs";

export function AdminTabLayout({
  tab,
  error,
  successToast,
  children,
}: {
  tab: Tab;
  error: string | null;
  successToast: string | null;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 space-y-6 overflow-auto p-4 sm:p-8">
      {error && <Toast kind="error">{error}</Toast>}
      {successToast && <Toast kind="success">{successToast}</Toast>}
      <AdminTabGuide tab={tab} />
      {children}
    </main>
  );
}
