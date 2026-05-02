"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";
import { AdminCard, Field, Icon, Toast } from "./ui";

type IyzicoExtra = {
  callbackUrl?: string;
  frontendUrl?: string;
  baseUrl?: string;
  locale?: "tr" | "en";
};

type ProviderConfigView = {
  provider: "IYZICO" | "MOCK" | "PAYTR" | "STRIPE";
  enabled: boolean;
  sandbox: boolean;
  apiKey: string | null;
  hasSecret: boolean;
  secretPreview: string | null;
  extra: IyzicoExtra;
  updatedAt: string | null;
};

type TestResult = { ok: boolean; message: string; errorCode?: string };

function toInputs(cfg: ProviderConfigView | null): {
  enabled: boolean;
  sandbox: boolean;
  apiKey: string;
  secretKey: string;
  callbackUrl: string;
  frontendUrl: string;
  baseUrl: string;
} {
  return {
    enabled: cfg?.enabled ?? false,
    sandbox: cfg?.sandbox ?? true,
    apiKey: cfg?.apiKey ?? "",
    secretKey: "",
    callbackUrl: cfg?.extra?.callbackUrl ?? "",
    frontendUrl: cfg?.extra?.frontendUrl ?? "",
    baseUrl: cfg?.extra?.baseUrl ?? "",
  };
}

export function PaymentsEditor({ token }: { token: string }) {
  const [cfg, setCfg] = useState<ProviderConfigView | null>(null);
  const [form, setForm] = useState(toInputs(null));
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = (await adminFetch("/payments/providers/IYZICO", token)) as ProviderConfigView;
      setCfg(data);
      setForm(toInputs(data));
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Yüklenemedi");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!cfg) return true;
    const base = toInputs(cfg);
    return (
      base.enabled !== form.enabled ||
      base.sandbox !== form.sandbox ||
      base.apiKey !== form.apiKey ||
      form.secretKey.length > 0 ||
      base.callbackUrl !== form.callbackUrl ||
      base.frontendUrl !== form.frontendUrl ||
      base.baseUrl !== form.baseUrl
    );
  }, [cfg, form]);

  const save = useCallback(async () => {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: form.enabled,
        sandbox: form.sandbox,
        apiKey: form.apiKey.trim() || null,
        extra: {
          callbackUrl: form.callbackUrl.trim() || null,
          frontendUrl: form.frontendUrl.trim() || null,
          baseUrl: form.baseUrl.trim() || null,
          locale: "tr",
        },
      };
      if (form.secretKey.trim().length > 0) {
        payload.secretKey = form.secretKey.trim();
      }
      const data = (await adminFetch("/payments/providers/IYZICO", token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })) as ProviderConfigView;
      setCfg(data);
      setForm(toInputs(data));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Kaydedilemedi");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }, [form, token]);

  const runTest = useCallback(async () => {
    setTestResult(null);
    setTesting(true);
    try {
      const body: Record<string, unknown> = { sandbox: form.sandbox };
      if (form.apiKey.trim()) body.apiKey = form.apiKey.trim();
      if (form.secretKey.trim()) body.secretKey = form.secretKey.trim();
      if (form.baseUrl.trim()) body.baseUrl = form.baseUrl.trim();
      const res = (await adminFetch("/payments/providers/iyzico/test", token, {
        method: "POST",
        body: JSON.stringify(body),
      })) as TestResult;
      setTestResult(res);
    } catch (e) {
      const msg = formatAdminCaughtError(e, String(e));
      if (msg)
        setTestResult({
          ok: false,
          message: msg,
        });
    } finally {
      setTesting(false);
    }
  }, [form, token]);

  const status = useMemo(() => {
    if (!cfg) return { color: "slate", label: "Yükleniyor", desc: "" };
    if (!cfg.apiKey || !cfg.hasSecret)
      return {
        color: "amber",
        label: "Yapılandırılmamış",
        desc: "API key ve secret gerekli.",
      };
    if (!cfg.enabled)
      return {
        color: "slate",
        label: "Devre dışı",
        desc: "Kaydedildi ama müşteriler için kapalı.",
      };
    return {
      color: cfg.sandbox ? "sky" : "emerald",
      label: cfg.sandbox ? "Aktif (sandbox)" : "Aktif (canlı)",
      desc: cfg.sandbox ? "Test kartları ile ödeme alınır." : "Gerçek ödeme kabul edilir.",
    };
  }, [cfg]);

  const defaultCallback =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:4000/api/payments/iyzico/callback`
      : "http://localhost:4000/api/payments/iyzico/callback";
  const defaultFrontend =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const statusTone: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <div className="space-y-6 pb-24">
      {error && <Toast kind="error">{error}</Toast>}
      {saved && <Toast kind="success">iyzico ayarları kaydedildi.</Toast>}

      <AdminCard
        title={
          <span className="inline-flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #1e4aff, #7c3aed)" }}
              aria-hidden
            >
              i
            </span>
            iyzico bağlantısı
          </span>
        }
        description="Merchant panelindeki API key ve Secret key'i girin."
        actions={
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ${
              statusTone[status.color]
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status.color === "emerald"
                  ? "bg-emerald-500"
                  : status.color === "sky"
                    ? "bg-sky-500"
                    : status.color === "amber"
                      ? "bg-amber-500"
                      : "bg-slate-500"
              }`}
              aria-hidden
            />
            {status.label}
          </span>
        }
      >
        {status.desc && (
          <p className="-mt-2 mb-4 text-xs text-slate-500">{status.desc}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">Müşterilere aç</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Ödeme sayfasında iyzico akışı başlasın.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={form.sandbox}
              onChange={(e) => setForm((f) => ({ ...f, sandbox: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">Sandbox modu</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Kapalıyken gerçek ödeme alınır. Başlangıçta açık bırakın.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="API Key" hint="sandbox-api-key-... veya api-key-...">
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className="input-soft pr-10 font-mono text-xs"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((s) => !s)}
                aria-label={showApiKey ? "Gizle" : "Göster"}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                {showApiKey ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </Field>
          <Field
            label="Secret Key"
            hint={
              cfg?.hasSecret
                ? `Kaydedilmiş: ${cfg.secretPreview}. Değiştirmek için yeni değer girin.`
                : "sandbox-secret-... veya secret-..."
            }
          >
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                className="input-soft pr-10 font-mono text-xs"
                placeholder={cfg?.hasSecret ? "Değiştirmek için yazın" : ""}
                value={form.secretKey}
                onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                aria-label={showSecret ? "Gizle" : "Göster"}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                {showSecret ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runTest()}
            disabled={testing || busy || (!form.apiKey.trim() && !cfg?.apiKey)}
            className="btn-ghost disabled:opacity-50"
          >
            {testing ? "Test ediliyor…" : "Bağlantıyı test et"}
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !dirty}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Check />
            {busy ? "Kaydediliyor…" : "Ayarları kaydet"}
          </button>
        </div>

        {testResult && (
          <div className="mt-4">
            <Toast kind={testResult.ok ? "success" : "error"}>
              {testResult.message}
              {testResult.errorCode ? ` · ${testResult.errorCode}` : ""}
            </Toast>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Adresler"
        description="iyzico ödeme formundan dönüşte kullanılacak URL'ler."
      >
        <Field
          label="Callback URL"
          hint={
            <>
              iyzico ödeme sonucunu buraya POST eder. Boş bırakılırsa{" "}
              <span className="font-mono">{defaultCallback}</span> kullanılır. Canlı sunucuda
              mutlaka herkese açık, HTTPS bir URL olmalı.
            </>
          }
        >
          <input
            className="input-soft font-mono text-xs"
            value={form.callbackUrl}
            onChange={(e) => setForm((f) => ({ ...f, callbackUrl: e.target.value }))}
            placeholder={defaultCallback}
          />
        </Field>

        <Field
          label="Frontend URL"
          className="mt-3"
          hint={
            <>
              Ödeme sonrası müşterinin geri döneceği site kökü. Boş bırakılırsa{" "}
              <span className="font-mono">{defaultFrontend}</span> kullanılır.
            </>
          }
        >
          <input
            className="input-soft font-mono text-xs"
            value={form.frontendUrl}
            onChange={(e) => setForm((f) => ({ ...f, frontendUrl: e.target.value }))}
            placeholder={defaultFrontend}
          />
        </Field>

        <Field
          label="iyzico API base URL (opsiyonel)"
          className="mt-3"
          hint="Boş bırakın — sandbox/canlı otomatik seçilir."
        >
          <input
            className="input-soft font-mono text-xs"
            value={form.baseUrl}
            onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
            placeholder={
              form.sandbox ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com"
            }
          />
        </Field>
      </AdminCard>

      <AdminCard
        title="Sandbox test kartları"
        description="Sandbox modu açıkken bu kartlar her zaman çalışır."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { brand: "Visa (başarılı)", number: "5528 7900 0000 0008", cvc: "123" },
            { brand: "Master (başarılı)", number: "5400 0100 0000 0080", cvc: "123" },
            { brand: "Troy (başarılı)", number: "9792 0300 0000 0008", cvc: "123" },
          ].map((c) => (
            <div key={c.number} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {c.brand}
              </p>
              <p className="mt-2 font-mono text-base text-slate-900">{c.number}</p>
              <p className="mt-1 text-xs text-slate-500">
                SKT: 12/2030 · CVC: {c.cvc}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          iyzico sandbox&apos;ta 3D Secure şifresi istenirse{" "}
          <span className="font-mono">a</span> (küçük harf) yazabilirsiniz.
        </p>
      </AdminCard>
    </div>
  );
}
