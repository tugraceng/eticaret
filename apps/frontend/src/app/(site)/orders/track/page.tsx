"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function OrderTrackEntryPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) {
      setError("Sipariş numarası girin.");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(id)}`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="section-shell p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-indigo-50/70 to-transparent" aria-hidden />
        <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sipariş takip</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Siparişinizi bulun
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sipariş numaranızı girin, durum ve kargo bilgilerini görüntüleyin.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Sipariş no
            </label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="input-soft mt-2"
              placeholder="örn: cm9abc123xyz..."
              autoComplete="off"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary">
            Takip et →
          </button>
        </form>
        </div>
      </div>
    </main>
  );
}

