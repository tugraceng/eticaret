import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import { redirectAdminToLogin } from "@/lib/platform-session";

export async function adminFetch(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<unknown> {
  const t = typeof token === "string" ? token.trim() : "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(init.headers ?? {}),
  };
  const res = await fetch(apiUrl(path), { ...init, headers });
  const text = await res.text();
  if (!res.ok) {
    const msg = formatApiErrorPayload(text, res.status) || res.statusText;
    if (res.status === 401 && t) redirectAdminToLogin();
    throw new Error(msg);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Admin JWT ile görsel yükleme; dönen url veritabanında saklanır. */
export async function adminUploadFile(token: string, file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  const auth = typeof token === "string" ? token.trim() : "";
  const res = await fetch(apiUrl("/uploads"), {
    method: "POST",
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = formatApiErrorPayload(text, res.status) || res.statusText;
    if (res.status === 401 && auth) redirectAdminToLogin();
    throw new Error(msg);
  }
  return JSON.parse(text) as { url: string };
}
