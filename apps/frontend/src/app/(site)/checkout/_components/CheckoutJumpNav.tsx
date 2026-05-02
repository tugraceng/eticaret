"use client";

export function CheckoutJumpNav() {
  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const items = [
    { id: "checkout-adres", n: "1", label: "Teslimat" },
    { id: "checkout-sepet", n: "2", label: "Sepet ve onaylar" },
    { id: "checkout-odeme", n: "3", label: "Ödeme" },
  ];
  return (
    <nav aria-label="Ödeme bölümleri" className="no-scrollbar overflow-x-auto">
      <ol className="flex min-w-0 items-center gap-2 sm:gap-3">
        {items.map((it, i) => (
          <li key={it.id} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => jump(it.id)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[10px] text-white">
                {it.n}
              </span>
              {it.label}
            </button>
            {i < items.length - 1 ? <span aria-hidden className="text-slate-300">→</span> : null}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Tek sayfada tüm adımlar; aşağı kaydırın veya yukarıdaki kısayolları kullanın. Tarayıcı adresinizi{" "}
        <span className="font-medium text-slate-700">otomatik doldurma</span> ile hızlandırabilirsiniz.
      </p>
    </nav>
  );
}
