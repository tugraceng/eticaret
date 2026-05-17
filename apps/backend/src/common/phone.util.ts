/**
 * TR cep telefonu normalizasyonu (NetGSM `gsmno`: 10 hane, 5 ile başlar).
 */
export function normalizePhoneTrMobile10(raw: string): string | null {
  if (!raw?.trim()) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && digits.startsWith("5")) return digits;
  return null;
}

/**
 * WhatsApp / uluslararası benzeri E.164 rakam dizisi (örn. 905551234567).
 */
export function normalizePhoneToE164(raw: string, defaultCountryCode = "90"): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith(defaultCountryCode) && digits.length === 10) {
    digits = defaultCountryCode + digits;
  }
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

/** "Merhaba {ad}" gibi hazır mesajı kullanıcıya özelleştir. */
export function buildWaMeUrl(rawPhone: string, text?: string | null): string | null {
  const phone = normalizePhoneToE164(rawPhone);
  if (!phone) return null;
  const qs = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${qs}`;
}
