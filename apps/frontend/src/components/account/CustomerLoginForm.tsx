"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthSplitShell, type AuthPagePanel } from "@/components/account/AuthSplitShell";
import { GoogleIcon } from "@/components/account/GoogleIcon";
import { mergeGuestCartIntoServerCart } from "@/lib/cart-sync";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import {
  CUSTOMER_EMAIL_KEY,
  CUSTOMER_TOKEN_KEY,
  clearCustomerSession,
} from "@/lib/platform-session";

export function CustomerLoginForm({
  siteName,
  authPanel,
  returnTo: returnToProp,
}: {
  siteName: string;
  authPanel?: AuthPagePanel;
  /** Sunucudan güvenli yol (ör. `/sepet`). URL `callbackUrl` / `from` ile de verilebilir. */
  returnTo?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const safeReturn = useMemo(() => {
    if (returnToProp && returnToProp.startsWith("/") && !returnToProp.startsWith("//")) {
      return returnToProp;
    }
    const raw = sp.get("callbackUrl") ?? sp.get("from") ?? "";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/hesap";
  }, [returnToProp, sp]);
  const googleLoginEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";
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
      if (res.ok) router.replace(safeReturn);
      else clearCustomerSession();
    });
    return () => {
      cancelled = true;
    };
  }, [router, safeReturn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const oauthErr = sp.get("oauth_error");
    if (!oauthErr) return;
    setError(
      oauthErr === "1"
        ? "Google ile giriş tamamlanamadı. E-postanızla kayıtlı bir hesabınız yoksa önce kayıt olun."
        : "Google ile giriş tamamlanamadı.",
    );
    const params = new URLSearchParams(sp.toString());
    params.delete("oauth_error");
    const q = params.toString();
    router.replace(`${window.location.pathname}${q ? `?${q}` : ""}`, { scroll: false });
  }, [sp, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#access_token=")) return;
    let token: string;
    try {
      token = decodeURIComponent(hash.slice("#access_token=".length));
    } catch {
      return;
    }
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      try {
        const res = await fetch(apiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) throw new Error("Oturum doğrulanamadı");
        const me = (await res.json()) as { email: string };
        sessionStorage.setItem(CUSTOMER_EMAIL_KEY, me.email);
        await mergeGuestCartIntoServerCart();
        router.replace(safeReturn);
      } catch (e) {
        if (!cancelled) {
          clearCustomerSession();
          setError(e instanceof Error ? e.message : "Oturum açılamadı");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, safeReturn]);

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
      await mergeGuestCartIntoServerCart();
      router.replace(safeReturn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }, [email, password, router, safeReturn]);

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
      bottomAccessory={
        <p>
          Hesabınız yok mu?{" "}
          <Link
            href={`/hesap/kayit?callbackUrl=${encodeURIComponent(safeReturn)}`}
            className="auth-footer-link"
          >
            Kayıt olun
          </Link>
        </p>
      }
    >
      {googleLoginEnabled ? (
        <>
          <button
            type="button"
            disabled={busy}
            title="Google ile giriş"
            onClick={() => {
              if (busy) return;
              window.location.assign(apiUrl("/auth/oauth/google"));
            }}
            className="auth-btn-google"
          >
            <GoogleIcon />
            Google ile devam et
          </button>
          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Önce sitede aynı e-posta ile kayıt olmalısınız.
          </p>
          <div className="auth-divider" aria-hidden>
            <span>veya e-posta</span>
          </div>
        </>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div>
          <label className="auth-field-label" htmlFor="login-email">
            E-posta
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            className="auth-field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username email"
            placeholder="ornek@email.com"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="auth-field-label" htmlFor="login-password">
              Şifre
            </label>
            <Link
              href="/hesap/sifre-unuttum"
              className="text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
            >
              Şifremi unuttum
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            className="auth-field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <p className="auth-error whitespace-pre-wrap">{error}</p> : null}

        <button type="submit" disabled={busy} className="auth-btn-primary">
          {busy ? "Giriş…" : "Giriş yap"}
        </button>
      </form>
    </AuthSplitShell>
  );
}
