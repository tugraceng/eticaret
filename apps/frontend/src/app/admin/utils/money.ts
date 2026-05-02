/** "12,50" veya "12.5" → kuruş; boş → null; geçersiz → hata. */
export function parseTryToCents(raw: string): { ok: true; cents: number } | { ok: false; message: string } {
  const t = raw.trim();
  if (t === "") return { ok: false, message: "Fiyat alanı boş bırakılamaz." };
  const n = parseFloat(t.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { ok: false, message: "Geçerli bir fiyat girin (örn. 199,90)." };
  return { ok: true, cents: Math.round(n * 100) };
}

export function parseTryToCentsOptional(raw: string): { ok: true; cents: number | null } | { ok: false; message: string } {
  const t = raw.trim();
  if (t === "") return { ok: true, cents: null };
  const n = parseFloat(t.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { ok: false, message: "İndirimli fiyat geçersiz." };
  return { ok: true, cents: Math.round(n * 100) };
}

export function formatCentsAsTryInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
