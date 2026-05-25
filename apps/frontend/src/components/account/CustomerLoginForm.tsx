"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthSplitShell, type AuthPagePanel } from "@/components/account/AuthSplitShell";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { mergeGuestCartIntoServerCart } from "@/lib/cart-sync";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import {
  clearCustomerSession,
  getCustomerToken,
  setCustomerSession,
} from "@/lib/platform-session";
import { resetSiteOverlaysOnNavigation } from "@/lib/reset-site-overlays";

export function CustomerLoginForm({
  siteName,
  authPanel,
  returnTo: safeReturn = "/hesap",
  googleLoginEnabled = false,
  initialOauthError,
}: {
  siteName: string;
  authPanel?: AuthPagePanel;
  returnTo?: string;
  googleLoginEnabled?: boolean;
  initialOauthError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialOauthError) return;
    setError(
      initialOauthError === "1"
        ? "Google ile giriş tamamlanamadı. E-postanızla kayıtlı bir hesabınız yoksa önce kayıt olun."
        : "Google ile giriş tamamlanamadı.",
    );
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("oauth_error");
    const q = params.toString();
    router.replace(`${window.location.pathname}${q ? `?${q}` : ""}`, { scroll: false });
  }, [initialOauthError, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tok = getCustomerToken();
    if (!tok) return;
    let cancelled = false;
    void fetch(apiUrl("/customers/me"), {
      headers: { Authorization: `Bearer ${tok}` },
      cache: "no-store",
    }).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        resetSiteOverlaysOnNavigation();
        router.replace(safeReturn);
      } else clearCustomerSession();
    });
    return () => {
      cancelled = true;
    };
  }, [router, safeReturn]);

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
      setCustomerSession(token);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      try {
        const res = await fetch(apiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) throw new Error("Oturum doğrulanamadı");
        const me = (await res.json()) as { email: string };
        setCustomerSession(token, me.email);
        await mergeGuestCartIntoServerCart();
        resetSiteOverlaysOnNavigation();
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
      setCustomerSession(data.accessToken, data.user.email);
      await mergeGuestCartIntoServerCart();
      resetSiteOverlaysOnNavigation();
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
          <GoogleAuthButton disabled={busy} showRegisterHint />
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
            <Link href="/hesap/sifre-unuttum" className="auth-footer-link text-xs font-medium">
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
