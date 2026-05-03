export const ACCOUNT_TAB_IDS = [
  "overview",
  "orders",
  "returns",
  "addresses",
  "profile",
  "password",
] as const;

export type AccountTabId = (typeof ACCOUNT_TAB_IDS)[number];

export function isAccountTabId(v: string): v is AccountTabId {
  return (ACCOUNT_TAB_IDS as readonly string[]).includes(v);
}
