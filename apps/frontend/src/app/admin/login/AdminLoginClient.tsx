"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import { ADMIN_TOKEN_KEY } from "@/lib/platform-session";
import { Icon, Toast } from "../ui";

export function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@store.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const tok = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (tok) router.replace("/admin");
  }, [router]);

  const submit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const ms = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "15000");
      const signal =
        typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
          ? AbortSignal.timeout(Number.isFinite(ms) && ms > 0 ? ms : 15000)
          : undefined;
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        ...(signal ? { signal } : {}),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(formatApiErrorPayload(text, res.status) || res.statusText);
      const data = JSON.parse(text) as { accessToken: string; user: { role: string } };
      if (data.user.role !== "ADMIN")
        throw new Error("Yalnızca yönetici kullanıcılar giriş yapabilir.");
      const accessToken = typeof data.accessToken === "string" ? data.accessToken.trim() : "";
      if (!accessToken) throw new Error("Sunucudan jeton alınamadı.");
      sessionStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
      /* Tam yükleme: AuthGate/React state sıfırlandığı için token ile panel stabil açılır */
      window.location.assign("/admin");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "TimeoutError" || msg.includes("aborted") || msg.includes("signal")) {
        setError("Sunucuya zamanında ulaşılamadı. API çalışıyor mu ve NEXT_PUBLIC_API_URL doğru mu?");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError(
          "API'ye ulaşılamıyor. Backend'in çalıştığını ve NEXT_PUBLIC_API_URL adresinin tarayıcıdan erişilebilir olduğunu doğrulayın.",
        );
      } else {
        setError(msg || "Giriş başarısız");
      }
    } finally {
      setBusy(false);
    }
  }, [email, password]);

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      <div
        aria-hidden
        className="absolute -top-40 -left-40 -z-10 h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(56,189,248,0.45), transparent)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 -z-10 h-[560px] w-[560px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.4), transparent)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="fade-up surface-soft relative w-full max-w-md rounded-3xl border-white/10 bg-white/10 p-8 shadow-[0_30px_60px_-30px_rgba(2,6,23,0.9)] backdrop-blur-xl sm:p-10"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg"
          >
            <Icon.Dashboard className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
              Yönetim
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-white">Mağaza paneli</h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-slate-300">
          Yalnızca <span className="font-semibold text-white">ADMIN</span> rolü olan kullanıcılar
          giriş yapabilir.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              E-posta
            </span>
            <input
              type="email"
              required
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white/15 focus:ring-4 focus:ring-sky-500/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Şifre
            </span>
            <div className="relative mt-2">
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white/15 focus:ring-4 focus:ring-sky-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                {showPw ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </label>
        </div>

        {error && (
          <div className="mt-4">
            <Toast kind="error">{error}</Toast>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Giriş yapılıyor…" : "Giriş yap"}
          <span aria-hidden>→</span>
        </button>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="link-underline text-sky-300 hover:text-white">
            ← Siteye dön
          </Link>
        </p>
      </form>
    </div>
  );
}
