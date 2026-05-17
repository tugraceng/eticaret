"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ProductVariantDto = {
  id: string;
  label: string;
  stock: number;
  trackStock: boolean;
  priceCents: number | null;
  /** Ürün galerisindeki görsel; seçildiğinde vitrin bu görsele geçer */
  productImageId: string | null;
};

export type ProductGalleryImageRef = { id: string; url: string };

/** Varyant fiyatı boş veya geçersizse ürün taban fiyatı (kuruş). */
export function resolveVariantPriceCents(
  variantPriceCents: number | null | undefined,
  basePriceCents: number,
): number {
  if (variantPriceCents == null) return basePriceCents;
  if (typeof variantPriceCents !== "number" || !Number.isFinite(variantPriceCents)) return basePriceCents;
  if (variantPriceCents < 0) return basePriceCents;
  return variantPriceCents;
}

type Ctx = {
  variants: ProductVariantDto[];
  /** Ürün taban fiyatı; varyantta fiyat yoksa buna düşülür */
  basePriceCents: number;
  /** Galeri sırasına göre görseller (kimlik + URL) */
  productGallery: readonly ProductGalleryImageRef[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selected: ProductVariantDto | null;
  effectivePriceCents: () => number;
  allVariantsSoldOut: boolean;
  showPublicStockCount: boolean;
  /** Sepet / yapışkan çubuk için seçilen varyanta uygun küçük görsel URL */
  resolvedPrimaryImageUrl: string;
};

const EMPTY: Ctx = {
  variants: [],
  basePriceCents: 0,
  productGallery: [],
  selectedId: null,
  setSelectedId: () => {},
  selected: null,
  effectivePriceCents: () => 0,
  allVariantsSoldOut: false,
  showPublicStockCount: true,
  resolvedPrimaryImageUrl: "",
};

const ProductVariantContext = createContext<Ctx | null>(null);

export function ProductVariantProvider({
  children,
  variants,
  basePriceCents,
  productGallery,
  defaultSelectedId,
  showPublicStockCount = true,
}: {
  children: ReactNode;
  variants: ProductVariantDto[];
  basePriceCents: number;
  productGallery: readonly ProductGalleryImageRef[];
  defaultSelectedId?: string | null;
  /** false iken varyant etiketlerinde stok adedi gösterilmez */
  showPublicStockCount?: boolean;
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
    () =>
      selected ? resolveVariantPriceCents(selected.priceCents, basePriceCents) : basePriceCents,
    [selected, basePriceCents],
  );

  const allVariantsSoldOut = useMemo(
    () =>
      variants.length > 0 && variants.every((v) => v.trackStock && v.stock <= 0),
    [variants],
  );

  const resolvedPrimaryImageUrl = useMemo(() => {
    const first = productGallery[0]?.url ?? "";
    if (!selected?.productImageId) return first;
    const hit = productGallery.find((g) => g.id === selected.productImageId);
    return hit?.url ?? first;
  }, [selected, productGallery]);

  const value = useMemo(
    () => ({
      variants,
      basePriceCents,
      productGallery,
      selectedId,
      setSelectedId,
      selected,
      effectivePriceCents,
      allVariantsSoldOut,
      showPublicStockCount,
      resolvedPrimaryImageUrl,
    }),
    [
      variants,
      basePriceCents,
      productGallery,
      selectedId,
      setSelectedId,
      selected,
      effectivePriceCents,
      allVariantsSoldOut,
      showPublicStockCount,
      resolvedPrimaryImageUrl,
    ],
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
