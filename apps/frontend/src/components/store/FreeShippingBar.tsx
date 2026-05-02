"use client";

import { memo, useMemo } from "react";

type Props = {
  subtotalCents: number;
  freeShippingThresholdCents: number;
  className?: string;
};

/** Kargo ücretsiz eşiğine kalan tutar — dönüşüm odaklı ilerleme çubuğu */
export const FreeShippingBar = memo(function FreeShippingBar({
  subtotalCents,
  freeShippingThresholdCents,
  className = "",
}: Props) {
  const { pct, remaining, reached } = useMemo(() => {
    if (freeShippingThresholdCents <= 0) {
      return { pct: 100, remaining: 0, reached: true };
    }
    const p = Math.min(100, Math.round((subtotalCents / freeShippingThresholdCents) * 100));
    const rem = Math.max(0, freeShippingThresholdCents - subtotalCents);
    return { pct: p, remaining: rem, reached: subtotalCents >= freeShippingThresholdCents };
  }, [subtotalCents, freeShippingThresholdCents]);

  const fmt = (c: number) => (c / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });

  if (freeShippingThresholdCents <= 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-small">
        <span className="font-medium text-[var(--ds-text)]">
          {reached ? "Ücretsiz kargo kazandınız" : "Ücretsiz kargo hedefi"}
        </span>
        {!reached && (
          <span className="text-[var(--ds-text-muted)]">{fmt(remaining)} kaldı</span>
        )}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--ds-surface-muted)] ring-1 ring-[var(--ds-border)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ücretsiz kargo ilerlemesi"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500 ease-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
