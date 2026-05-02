"use client";

import { useState } from "react";

export function ShopPromoCodeCopy({ code }: { code: string }) {
  const [ok, setOk] = useState(false);

  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/90 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">İndirim kodu</p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-slate-900">
          {code}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setOk(true);
              window.setTimeout(() => setOk(false), 2000);
            } catch {
              setOk(false);
            }
          }}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {ok ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
    </div>
  );
}
