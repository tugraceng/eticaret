/** Güvenli dahili yönlendirme yolu */
export function resolveAuthReturnTo(raw: string | undefined | null): string {
  const v = raw?.trim() ?? "";
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return "/hesap";
}

export function googleLoginEnabledFromSettings(
  settingsFlag: boolean | undefined,
): boolean {
  if (settingsFlag) return true;
  return process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";
}
