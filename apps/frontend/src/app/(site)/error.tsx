"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Geçici sorun</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        Bu sayfa yüklenirken bir hata oluştu
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Bağlantınızı kontrol edip tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Yeniden dene
        </button>
        <Link
          href="/"
          className="min-h-11 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}
