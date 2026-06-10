const ITEMS = [
  "Hızlı Üretim",
  "Türkiye Geneli Kargo",
  "Kaliteli Filamentler",
  "Güvenli Ödeme",
] as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" fill="none" aria-hidden>
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
    <ul className="si-hero-v2-trust mt-5 grid grid-cols-2 gap-x-2 gap-y-2 sm:mt-6 sm:gap-x-4 sm:gap-y-2.5 lg:mt-8">
      {ITEMS.map((label) => (
        <li
          key={label}
          className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-300/90 sm:gap-2 sm:text-xs lg:text-slate-400"
        >
          <CheckIcon />
          <span className="leading-tight">{label}</span>
        </li>
      ))}
    </ul>
  );
}
