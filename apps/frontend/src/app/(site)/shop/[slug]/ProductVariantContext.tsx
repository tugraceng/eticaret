"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ProductVariantDto = {
  id: string;
  label: string;
  stock: number;
  trackStock: boolean;
  priceCents: number | null;
};

type Ctx = {
  variants: ProductVariantDto[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selected: ProductVariantDto | null;
  effectivePriceCents: (basePriceCents: number) => number;
  allVariantsSoldOut: boolean;
};

const EMPTY: Ctx = {
  variants: [],
  selectedId: null,
  setSelectedId: () => {},
  selected: null,
  effectivePriceCents: (b) => b,
  allVariantsSoldOut: false,
};

const ProductVariantContext = createContext<Ctx | null>(null);

export function ProductVariantProvider({
  children,
  variants,
  defaultSelectedId,
}: {
  children: ReactNode;
  variants: ProductVariantDto[];
  defaultSelectedId?: string | null;
}) {
  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    if (defaultSelectedId && variants.some((v) => v.id === defaultSelectedId)) {
      return defaultSelectedId;
    }
    const inStock = variants.find((v) => !v.trackStock || v.stock > 0);
    return inStock?.id ?? variants[0]?.id ?? null;
  });

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
  }, []);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? null,
    [variants, selectedId],
  );

  const effectivePriceCents = useCallback(
    (basePriceCents: number) =>
      selected ? (selected.priceCents ?? basePriceCents) : basePriceCents,
    [selected],
  );

  const allVariantsSoldOut = useMemo(
    () =>
      variants.length > 0 && variants.every((v) => v.trackStock && v.stock <= 0),
    [variants],
  );

  const value = useMemo(
    () => ({
      variants,
      selectedId,
      setSelectedId,
      selected,
      effectivePriceCents,
      allVariantsSoldOut,
    }),
    [variants, selectedId, setSelectedId, selected, effectivePriceCents, allVariantsSoldOut],
  );

  return <ProductVariantContext.Provider value={value}>{children}</ProductVariantContext.Provider>;
}

export function useProductVariants(): Ctx {
  const v = useContext(ProductVariantContext);
  if (!v) throw new Error("useProductVariants requires ProductVariantProvider");
  return v;
}

export function useProductVariantsOptional(): Ctx {
  return useContext(ProductVariantContext) ?? EMPTY;
}
