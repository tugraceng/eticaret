"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { SITE_OVERLAY_RESET_EVENT } from "@/lib/reset-site-overlays";
import { showSiteToast } from "@/lib/site-toast";

const LS_DISMISS = "platform_email_popup_dismissed";

export function EmailCapturePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onReset = () => setOpen(false);
    window.addEventListener(SITE_OVERLAY_RESET_EVENT, onReset);
    return () => window.removeEventListener(SITE_OVERLAY_RESET_EVENT, onReset);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(LS_DISMISS)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 12000);
    return () => window.clearTimeout(t);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(LS_DISMISS, "1");
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showSiteToast({ message: "Geçerli bir e-posta girin.", kind: "error" });
      return;
    }
    try {
      await fetch(apiUrl("/analytics/events"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "email_subscribe",
          path: typeof window !== "undefined" ? window.location.pathname : "/",
          metadata: { email, source: "popup" },
        }),
      });
    } catch {
      // ağ hatası bile kapansın
    }
    showSiteToast({ message: "Teşekkürler — kampanya ve yeniliklerden haberdar olacaksınız.", kind: "success" });
    dismiss();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="email-cap-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Pencereyi kapat"
        >
          ×
        </button>
        <p id="email-cap-title" className="text-lg font-semibold text-slate-900">
          %10&apos;a varan fırsatlar için e-bülten
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Yeni ürün ve indirimleri ilk siz öğrenin. İstediğiniz zaman çıkabilirsiniz.
        </p>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="E-posta adresiniz"
            autoComplete="email"
            className="input-soft min-w-0 flex-1"
          />
          <button type="submit" className="btn-primary shrink-0">
            Kayıt ol
          </button>
        </form>
        <p className="mt-3 text-[10px] text-slate-400">
          Kayıt olarak{" "}
          <a href="/kvkk" className="underline">
            KVKK metnini
          </a>{" "}
          okuduğunuzu kabul edersiniz.
        </p>
      </div>
    </div>
  );
}
