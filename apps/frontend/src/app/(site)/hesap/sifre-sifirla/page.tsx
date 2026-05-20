"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import { PageContainer } from "@/components/site/PageContainer";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Sıfırlama bağlantısı geçersiz.");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(formatApiErrorPayload(text, res.status) || res.statusText);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İstek başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer width="narrow" className="py-10 sm:py-12">
      <div className="fade-up si-page-card text-center">
        <p className="si-kicker">Hesabım</p>
        <h1 className="si-heading mt-2 text-3xl sm:text-4xl">Yeni şifre oluştur</h1>
        <p className="si-body mt-2">Lütfen yeni şifrenizi belirleyin.</p>
      </div>

      {done ? (
        <div className="si-page-card mt-10 space-y-4 p-6 text-center text-sm">
          <p className="font-semibold text-emerald-400">Şifreniz güncellendi.</p>
          <Link href="/hesap/giris" className="auth-btn-primary inline-flex">
            Giriş yap
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="si-page-card mt-10 space-y-4 p-6 sm:p-7">
          <div>
            <label className="auth-field-label" htmlFor="reset-password">
              Yeni şifre
            </label>
            <input
              id="reset-password"
              type="password"
              className="auth-field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="auth-field-label" htmlFor="reset-password-confirm">
              Yeni şifre (tekrar)
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              className="auth-field-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {error ? <p className="auth-error whitespace-pre-wrap">{error}</p> : null}
          <button type="submit" disabled={busy} className="auth-btn-primary">
            {busy ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </button>
        </form>
      )}
    </PageContainer>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <PageContainer width="narrow" className="py-14 text-sm text-slate-400">
          Yükleniyor…
        </PageContainer>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
