/**
 * StoneIron3D / vitrin — ortak layout ve spacing sabitleri.
 * Header, footer ve PageContainer ile aynı grid hizası.
 */

export const siteContainerClass =
  "mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8";

/** Dikey bölüm boşlukları — tutarlı section rhythm */
export const sectionSpacing = {
  default: "py-12 sm:py-16 lg:py-20",
  tight: "py-8 sm:py-12",
  compact: "py-6 sm:py-8",
} as const;

export const dsRadius = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
} as const;

export const dsShadow = {
  card: "shadow-[var(--ds-shadow-card)]",
  lift: "shadow-[var(--ds-shadow-lift)]",
} as const;

/** Başlık ölçeği — tek H1 sayfa başına; alt seviyeler buradan */
export const headingClass = {
  h1: "text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]",
  h2: "text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl",
  h3: "text-lg font-semibold text-slate-900",
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500",
} as const;

export const dsTransition = "duration-200 ease-[var(--ease-smooth)]";
