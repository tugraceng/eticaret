/** Tek kaynak: dinamik `/admin/[tab]` ve istemci paneli aynı listeyi kullanır. */
export const ADMIN_TAB_IDS = [
  "overview",
  "home",
  "settings",
  "categories",
  "products",
  "cms",
  "orders",
  "customers",
  "discounts",
  "marketing",
  "payments",
  "reviews",
  "returns",
  "stock",
  "shipping",
  "notifications",
] as const;

export type Tab = (typeof ADMIN_TAB_IDS)[number];

export function isValidAdminTab(id: string): id is Tab {
  return (ADMIN_TAB_IDS as readonly string[]).includes(id);
}
