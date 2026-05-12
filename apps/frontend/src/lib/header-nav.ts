import type { SiteSettings } from "@/lib/settings";

export type HeaderNavLink = { label: string; href: string; muted?: boolean };

export type HeaderNavConfig = {
  beforeCategories: HeaderNavLink[];
  afterCategories: HeaderNavLink[];
};

export const DEFAULT_HEADER_NAV: HeaderNavConfig = {
  beforeCategories: [{ label: "Hakkımızda", href: "/about" }],
  afterCategories: [{ label: "3D baskı hizmeti", href: "/services", muted: true }],
};

function cloneDefault(): HeaderNavConfig {
  return {
    beforeCategories: DEFAULT_HEADER_NAV.beforeCategories.map((l) => ({ ...l })),
    afterCategories: DEFAULT_HEADER_NAV.afterCategories.map((l) => ({ ...l })),
  };
}

function isLinkRow(x: unknown): x is HeaderNavLink {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.label === "string" && o.label.trim().length > 0 && typeof o.href === "string" && o.href.trim().length > 0;
}

function normalizeLinkList(raw: unknown): HeaderNavLink[] {
  if (!Array.isArray(raw)) return [];
  const out: HeaderNavLink[] = [];
  for (const item of raw) {
    if (!isLinkRow(item)) continue;
    out.push({
      label: item.label.trim(),
      href: item.href.trim(),
      muted: Boolean(item.muted),
    });
  }
  return out;
}

/** Veritabanından gelen headerNav; yoksa veya geçersizse varsayılanlar. */
export function parseHeaderNav(raw: SiteSettings["headerNav"]): HeaderNavConfig {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return cloneDefault();
  }
  const o = raw as Record<string, unknown>;
  const def = cloneDefault();
  const before = "beforeCategories" in o ? normalizeLinkList(o.beforeCategories) : def.beforeCategories;
  const after = "afterCategories" in o ? normalizeLinkList(o.afterCategories) : def.afterCategories;
  return { beforeCategories: before, afterCategories: after };
}

/** Ayar formu: DB’de `beforeCategories` / `afterCategories` anahtarları varsa (boş dizi dahil) editöre aynen yansır. */
export function parseHeaderNavForEditor(raw: SiteSettings["headerNav"]): HeaderNavConfig {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if ("beforeCategories" in o || "afterCategories" in o) {
      return {
        beforeCategories: "beforeCategories" in o ? normalizeLinkList(o.beforeCategories) : [],
        afterCategories: "afterCategories" in o ? normalizeLinkList(o.afterCategories) : [],
      };
    }
  }
  return parseHeaderNav(raw);
}
