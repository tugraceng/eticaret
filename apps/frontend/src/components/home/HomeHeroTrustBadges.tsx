const ITEMS = [
  "Hızlı Üretim",
  "Türkiye Geneli Kargo",
  "Kaliteli Filamentler",
  "Güvenli Ödeme",
] as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <path
        d="M6 10.2 8.6 12.8 14 7.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeHeroTrustBadges() {
  return (
    <ul className="si-hero-v2-trust mt-6 grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 lg:mt-8">
      {ITEMS.map((label) => (
        <li key={label} className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-400 sm:text-xs">
          <CheckIcon />
          <span className="truncate">{label}</span>
        </li>
      ))}
    </ul>
  );
}
