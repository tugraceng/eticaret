"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";

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
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="fade-up section-shell text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Hesabım
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
          Yeni şifre oluştur
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Lütfen yeni şifrenizi belirleyin.
        </p>
      </div>

      {done ? (
        <div className="surface-soft mt-10 space-y-4 p-6 text-center text-sm text-slate-700">
          <p className="font-semibold text-emerald-700">Şifreniz güncellendi.</p>
          <Link href="/hesap/giris" className="btn-primary w-full">
            Giriş yap
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="surface-soft mt-10 space-y-4 p-6 sm:p-7">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Yeni şifre
            </label>
            <input
              type="password"
              className="input-soft mt-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Yeni şifre (tekrar)
            </label>
            <input
              type="password"
              className="input-soft mt-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {error && (
            <pre className="max-h-32 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </pre>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-14 text-sm text-slate-600">Yükleniyor…</div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
