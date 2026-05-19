"use client";

import Link from "next/link";
import { useState } from "react";
import { PageContainer } from "@/components/site/PageContainer";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(formatApiErrorPayload(text, res.status) || res.statusText);
      const data = text ? (JSON.parse(text) as { devResetUrl?: string }) : {};
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İstek başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer width="narrow" className="py-10 sm:py-12">
      <div className="fade-up section-shell text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Hesabım
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
          Şifremi unuttum
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      {done ? (
        <div className="surface-soft mt-10 space-y-4 p-6 text-sm text-slate-700">
          <p className="font-semibold text-emerald-700">
            Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.
          </p>
          <p>Lütfen gelen kutunuzu (ve spam klasörünüzü) kontrol edin.</p>
          {devUrl && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold">Geliştirme modu:</p>
              <a href={devUrl} className="break-all underline">
                {devUrl}
              </a>
            </div>
          )}
          <Link href="/hesap/giris" className="btn-ghost w-full">
            Giriş sayfasına dön
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="surface-soft mt-10 space-y-4 p-6 sm:p-7">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              E-posta
            </label>
            <input
              type="email"
              className="input-soft mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          {error && (
            <pre className="max-h-32 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </pre>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? "Gönderiliyor…" : "Bağlantı gönder"}
          </button>
          <p className="text-center text-sm text-slate-600">
            Hatırladınız mı?{" "}
            <Link href="/hesap/giris" className="link-underline font-semibold text-slate-900">
              Giriş yapın
            </Link>
          </p>
        </form>
      )}
    </PageContainer>
  );
}
