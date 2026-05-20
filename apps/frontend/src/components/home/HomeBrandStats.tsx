const STATS = [
  { value: "200+", label: "Özgün tasarım" },
  { value: "0.05mm", label: "Yüzey hassasiyeti" },
  { value: "24h", label: "Hızlı üretim" },
] as const;

export function HomeBrandStats() {
  return (
    <section className="si-section py-12 sm:py-14" aria-label="Marka metrikleri">
      <ul className="mx-auto flex max-w-lg flex-col items-center gap-10 px-4 sm:max-w-none sm:flex-row sm:justify-center sm:gap-16 sm:px-6 lg:px-8">
        {STATS.map((s) => (
          <li key={s.label} className="text-center">
            <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{s.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/90">
              {s.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
