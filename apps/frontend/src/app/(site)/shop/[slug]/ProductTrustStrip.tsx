export function ProductTrustStrip() {
  const items = [
    {
      label: "256-bit SSL",
      sub: "Güvenli ödeme",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Kolay iade",
      sub: "Politikamız geçerli",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v4h4" />
        </svg>
      ),
    },
    {
      label: "Müşteri desteği",
      sub: "Sipariş takibi",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5" />
        </svg>
      ),
    },
  ];
  return (
    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <li
          key={it.label}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-3 py-3 text-left shadow-sm"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600">{it.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">{it.label}</p>
            <p className="text-[11px] text-slate-500">{it.sub}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
