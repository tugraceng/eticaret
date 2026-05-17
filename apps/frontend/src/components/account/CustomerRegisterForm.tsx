"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthSplitShell, type AuthPagePanel } from "@/components/account/AuthSplitShell";
import { mergeGuestCartIntoServerCart } from "@/lib/cart-sync";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";
import {
  CUSTOMER_EMAIL_KEY,
  CUSTOMER_TOKEN_KEY,
  clearCustomerSession,
} from "@/lib/platform-session";

const PHONE_TR = /^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

function ageFrom(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function CustomerRegisterForm({
  siteName,
  authPanel,
}: {
  siteName: string;
  authPanel?: AuthPagePanel;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const safeReturn = useMemo(() => {
    const raw = sp.get("callbackUrl") ?? sp.get("from") ?? "";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/hesap";
  }, [sp]);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
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

  const validate = useCallback((): string | null => {
    if (!name.trim()) return "Ad zorunlu.";
    if (!surname.trim()) return "Soyad zorunlu.";
    if (!email.trim()) return "E-posta zorunlu.";
    if (!PHONE_TR.test(phone.trim())) return "Telefon TR cep formatında olmalı (05XX XXX XX XX).";
    if (!birthDate) return "Doğum tarihi zorunlu.";
    const age = ageFrom(birthDate);
    if (age === null) return "Doğum tarihi geçersiz.";
    if (age < 18) return "En az 18 yaşında olmalısınız.";
    if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
    if (password !== passwordConfirm) return "Şifreler eşleşmiyor.";
    if (!kvkk) return "KVKK aydınlatma metnini onaylamanız gerekir.";
    return null;
  }, [name, surname, email, phone, birthDate, password, passwordConfirm, kvkk]);

  const submit = useCallback(async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
          birthDate,
          kvkkAccepted: kvkk,
          marketingOptIn: marketing,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(formatApiErrorPayload(text, res.status) || res.statusText);
      const data = JSON.parse(text) as { accessToken: string; user: { email: string } };
      sessionStorage.setItem(CUSTOMER_TOKEN_KEY, data.accessToken);
      sessionStorage.setItem(CUSTOMER_EMAIL_KEY, data.user.email);
      await mergeGuestCartIntoServerCart();
      router.replace(safeReturn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  }, [email, password, name, surname, phone, birthDate, kvkk, marketing, router, safeReturn, validate]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AuthSplitShell
      contentAlign="start"
      siteName={siteName}
      title="Hesap oluşturun"
      subtitle="Siparişlerinizi takip edebilmeniz için birkaç bilgiye ihtiyacımız var."
      panelTitle={authPanel?.title}
      panelSubtitle={authPanel?.subtitle}
      panelImageUrl={authPanel?.imageUrl}
      panelGradientFrom={authPanel?.gradientFrom}
      panelGradientTo={authPanel?.gradientTo}
      panelTextColor={authPanel?.textColor}
      bottomAccessory={
        <p className="text-center text-sm text-slate-600">
          Zaten hesabınız var mı?{" "}
          <Link
            href={`/hesap/giris?callbackUrl=${encodeURIComponent(safeReturn)}`}
            className="font-semibold text-slate-900 hover:underline"
          >
            Giriş yapın
          </Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-800">Ad *</label>
            <input
              type="text"
              className="input-soft mt-1.5 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-800">Soyad *</label>
            <input
              type="text"
              className="input-soft mt-1.5 w-full"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-800">E-posta *</label>
          <input
            type="email"
            className="input-soft mt-1.5 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-800">Telefon *</label>
            <input
              type="tel"
              className="input-soft mt-1.5 w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="05XX XXX XX XX"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-800">Doğum tarihi *</label>
            <input
              type="date"
              className="input-soft mt-1.5 w-full"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={today}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-800">Şifre *</label>
            <input
              type="password"
              className="input-soft mt-1.5 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-800">Şifre (tekrar) *</label>
            <input
              type="password"
              className="input-soft mt-1.5 w-full"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={kvkk}
              onChange={(e) => setKvkk(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
              required
            />
            <span>
              <Link href="/kvkk" target="_blank" className="link-underline font-semibold text-slate-900">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum. *
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>Kampanya ve fırsatlardan e-posta/SMS ile haberdar olmak istiyorum (opsiyonel).</span>
          </label>
        </div>

        {error && (
          <pre className="max-h-32 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700 whitespace-pre-wrap">
            {error}
          </pre>
        )}

        <button type="submit" disabled={busy} className="store-cta-primary">
          {busy ? "Kayıt…" : "Kayıt ol"}
        </button>
      </form>
    </AuthSplitShell>
  );
}
