import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";

/** Tarayıcı / sunucuda aynı taban adresi (.env trim, sondaki / kırpılır) */
export function normalizedApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t !== "") return t.replace(/\/+$/, "");
  }
  return "http://localhost:4000/api";
}

const base = () => normalizedApiBase();

/** Tarayıcıda müşteri oturumu varsa isteklere Bearer ekler (açık uçları 401'siz kullanmak için elle header da verilebilir). */
export function browserCustomerAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    const t = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

const defaultTimeoutMs = () => {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "12000";
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 12000;
};

function mergeFetchInit(init?: RequestInit): RequestInit {
  if (init?.signal) return init;
  const ms = defaultTimeoutMs();
  try {
    const t = AbortSignal.timeout(ms);
    return { ...init, signal: t };
  } catch {
    return init ?? {};
  }
}

export function apiUrl(path: string): string {
  const b = base();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (b.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${b}${normalizedPath.slice(4)}`;
  }
  return `${b}${normalizedPath}`;
}

function apiOriginBase(): string {
  const b = base();
  return b.endsWith("/api") ? b.slice(0, -4) : b;
}

export function apiAssetUrl(pathOrUrl: string | null | undefined): string | null {
  const raw = pathOrUrl?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  try {
    return new URL(normalized, `${apiOriginBase()}/`).toString();
  } catch {
    return normalized;
  }
}

const STATUS_MESSAGES_TR: Partial<Record<number, string>> = {
  400: "Geçersiz istek",
  401: "Oturum geçersiz veya süresi doldu. Lütfen yeniden giriş yapın.",
  403: "Bu işlem için yetkiniz yok.",
  404: "Kayıt bulunamadı",
  409: "Bu işlem mevcut veriyle uyumsuz",
  422: "Gönderdiğiniz bilgiler doğrulanamadı",
  429: "Çok sık istek gönderdiniz; lütfen kısa bir süre sonra tekrar deneyin.",
  500: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
  502: "Sunucuya ulaşılamadı. Lütfen daha sonra deneyin.",
  503: "Şu anda hizmet kullanılamıyor",
};

/** İngilizce standart iletileri (Nest varsayılanları vb.) kullanıcıya Türkçe göster */
const KNOWN_MESSAGE_TR: Record<string, string> = {
  Unauthorized:
    "Oturum geçersiz veya süresi doldu. Lütfen yeniden giriş yapın.",
  Forbidden: "Bu işlem için yetkiniz yok.",
  "Not Found": "Kayıt bulunamadı",
  "Bad Request": "Geçersiz istek",
  Conflict: "Bu işlem mevcut veriyle uyumsuz",
  "Invalid credentials": "E-posta veya şifre hatalı.",
};

/**
 * API'den gelen ham gövde (çoğunlukla Nest JSON) veya düz metin → kısa, okunabilir mesaj.
 * Toast ve form `catch` blokları için `new Error(apiError)` yerine bunun üretdiği mesaj kullanılmalıdır.
 */
export function formatApiErrorPayload(rawBody: string, httpStatus: number): string {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return STATUS_MESSAGES_TR[httpStatus] ?? `İstek başarısız (${httpStatus}).`;
  }

  try {
    const j = JSON.parse(trimmed) as Record<string, unknown>;
    const msg = j.message;
    let parts: string[] = [];
    if (Array.isArray(msg)) {
      parts = msg.filter((x): x is string => typeof x === "string").map((s) => s.trim());
    } else if (typeof msg === "string" && msg.trim()) {
      parts = [msg.trim()];
    }
    const combined = parts.length > 0 ? parts.join(" • ") : "";

    if (combined) {
      return KNOWN_MESSAGE_TR[combined] ?? combined;
    }
  } catch {
    return trimmed.length > 360 ? `${trimmed.slice(0, 357)}…` : trimmed;
  }

  return STATUS_MESSAGES_TR[httpStatus] ?? `İstek başarısız (${httpStatus}).`;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const merged = mergeFetchInit(init);
  const res = await fetch(apiUrl(path), {
    ...merged,
    headers: {
      "Content-Type": "application/json",
      ...browserCustomerAuthHeaders(),
      ...(merged.headers ?? {}),
    },
    cache: merged.cache ?? "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    const readable = formatApiErrorPayload(text, res.status);
    throw new Error(readable || res.statusText);
  }
  return (await res.json()) as T;
}

export async function apiJsonSafe<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    return await apiJson<T>(path, init);
  } catch {
    return null;
  }
}
