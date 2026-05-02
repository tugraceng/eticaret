/** Mağaza URL'leri için Latin slug (Türkçe karakterler dönüştürülür). */
const TR_MAP: Record<string, string> = {
  ğ: "g",
  ü: "u",
  ş: "s",
  ı: "i",
  i: "i",
  ö: "o",
  ç: "c",
  İ: "i",
  I: "i",
};

export function slugifyTr(input: string): string {
  let s = input.trim().toLowerCase();
  for (const [k, v] of Object.entries(TR_MAP)) {
    s = s.split(k).join(v);
  }
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
