export const ADMIN_TOKEN_KEY = "platform_admin_token";
export const CUSTOMER_TOKEN_KEY = "platform_customer_token";
export const CUSTOMER_EMAIL_KEY = "platform_customer_email";

/** Eski oturumları sessionStorage → localStorage taşır (yeni sekme desteği). */
function migrateCustomerSessionToLocal() {
  if (typeof window === "undefined") return;
  try {
    const legacyToken = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (legacyToken && !localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, legacyToken);
      const legacyEmail = sessionStorage.getItem(CUSTOMER_EMAIL_KEY);
      if (legacyEmail) localStorage.setItem(CUSTOMER_EMAIL_KEY, legacyEmail);
    }
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  migrateCustomerSessionToLocal();
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCustomerEmail(): string | null {
  if (typeof window === "undefined") return null;
  migrateCustomerSessionToLocal();
  try {
    return localStorage.getItem(CUSTOMER_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setCustomerSession(token: string, email?: string | null) {
  if (typeof window === "undefined") return;
  migrateCustomerSessionToLocal();
  try {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    if (email?.trim()) localStorage.setItem(CUSTOMER_EMAIL_KEY, email.trim());
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

export function clearCustomerSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_EMAIL_KEY);
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

/** 401 sonrası: oturum temizlenir ve girişe yönlenilir; yakalayıcıda yüz yüze hata göstermeyin. */
export class CustomerSessionTerminated extends Error {
  constructor() {
    super("CUSTOMER_SESSION_TERMINATED");
    this.name = "CustomerSessionTerminated";
  }
}

/** Yönetici JWT geçersiz / süresi dolduğunda `adminFetch` içinde yönlendirme tetiklenir; yakalayıcıda bu hatayı yutun. */
export class AdminSessionTerminated extends Error {
  constructor() {
    super("ADMIN_SESSION_TERMINATED");
    this.name = "AdminSessionTerminated";
  }
}

export function redirectAdminToLogin(): never {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      /* ignore */
    }
    window.location.assign("/admin/login");
  }
  throw new AdminSessionTerminated();
}

export function redirectCustomerToLogin(): never {
  clearCustomerSession();
  if (typeof window !== "undefined") window.location.assign("/hesap/giris");
  throw new CustomerSessionTerminated();
}
