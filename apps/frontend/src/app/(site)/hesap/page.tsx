import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerAccountHome } from "@/components/account/CustomerAccountHome";

export const metadata: Metadata = { title: "Hesabım" };

export default function HesapPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">Yükleniyor…</div>}>
      <CustomerAccountHome />
    </Suspense>
  );
}
