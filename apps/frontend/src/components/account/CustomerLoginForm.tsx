"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthSplitShell, type AuthPagePanel } from "@/components/account/AuthSplitShell";
import { syncCartFromStorage } from "@/lib/cart-sync";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import {
  CUSTOMER_EMAIL_KEY,
  CUSTOMER_TOKEN_KEY,
  clearCustomerSession,
} from "@/lib/platform-session";

export function CustomerLoginForm({
  siteName,
  authPanel,
}: {
  siteName: string;
  authPanel?: AuthPagePanel;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tok = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!tok) return;
    let cancelled = false;
    void fetch(apiUrl("/customers/me"), {
      headers: { Authorization: `Bearer ${tok}` },
      cache: "no-store",
    }).then((res) => {
      if (cancelled) return;
      if (res.ok) router.replace("/hesap");
      else clearCustomerSession();
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(formatApiErrorPayload(text, res.status) || res.statusText);
      const data = JSON.parse(text) as { accessToken: string; user: { email: string } };
      sessionStorage.setItem(CUSTOMER_TOKEN_KEY, data.accessToken);
      sessionStorage.setItem(CUSTOMER_EMAIL_KEY, data.user.email);
      await syncCartFromStorage();
      router.replace("/hesap");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }, [email, password, router]);

  return (
    <AuthSplitShell
      siteName={siteName}
      title="Hoş geldiniz"
      subtitle="Bilgilerinizi girerek hesabınıza giriş yapın."
      panelTitle={authPanel?.title}
      panelSubtitle={authPanel?.subtitle}
      panelImageUrl={authPanel?.imageUrl}
      panelGradientFrom={authPanel?.gradientFrom}
      panelGradientTo={authPanel?.gradientTo}
      panelTextColor={authPanel?.textColor}
    >
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          title="Çok yakında"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-400"
        >
          <span className="text-base font-bold" aria-hidden>
            G
          </span>
          Google
        </button>
        <button
          type="button"
          disabled
          title="Çok yakında"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-400"
        >
          <span className="text-base" aria-hidden>
            
          </span>
          Apple
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-400">Sosyal giriş çok yakında</p>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <span className="bg-white px-2">veya e-posta</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div>
          <label className="text-xs font-semibold text-slate-800">E-posta</label>
          <input
            type="email"
            className="input-soft mt-1.5 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="ornek@email.com"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-800">Şifre</label>
            <Link
              href="/hesap/sifre-unuttum"
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
          <input
            type="password"
            className="input-soft mt-1.5 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <pre className="max-h-32 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700 whitespace-pre-wrap">
            {error}
          </pre>
        )}

        <button type="submit" disabled={busy} className="store-cta-primary">
          {busy ? "Giriş…" : "Giriş yap"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Hesabınız yok mu?{" "}
          <Link href="/hesap/kayit" className="font-semibold text-slate-900 hover:underline">
            Kayıt olun
          </Link>
        </p>
      </form>
    </AuthSplitShell>
  );
}
