import { AdminSessionTerminated } from "@/lib/platform-session";

/** `adminFetch` 401 sonrası yönlendirmeden önce bu hata atılır; UI'da göstermeyin. */
export function formatAdminCaughtError(e: unknown, fallback: string): string | undefined {
  if (e instanceof AdminSessionTerminated) return undefined;
  return e instanceof Error ? e.message : fallback;
}
