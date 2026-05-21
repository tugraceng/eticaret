"use client";

import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onApplied?: () => void;
};

function paramsFromForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  const p = new URLSearchParams();
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || !v.trim()) continue;
    p.set(k, v.trim());
  }
  return p;
}

export function ShopFiltersForm({ children, onApplied }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/shop";

  const apply = (form: HTMLFormElement) => {
    const qs = paramsFromForm(form).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    onApplied?.();
  };

  return (
    <form
      className="si-shop-filters-form space-y-3"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
