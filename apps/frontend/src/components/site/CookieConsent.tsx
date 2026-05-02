"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "platform_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = window.setTimeout(() => setVisible(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const save = (value: "all" | "essential") => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ value, at: new Date().toISOString() }),
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:left-4 sm:max-w-md"
    >
      <div className="surface-soft rounded-2xl p-5 shadow-2xl">
        <p className="text-sm font-semibold text-slate-900">Çerezler hakkında</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          Daha iyi bir deneyim sunmak ve siteyi iyileştirmek için çerezler kullanıyoruz. Detaylar için{" "}
          <Link href="/kvkk" className="underline underline-offset-2">
            KVKK Aydınlatma Metni
          </Link>{" "}
          ve{" "}
          <Link href="/gizlilik" className="underline underline-offset-2">
            Gizlilik Politikası
          </Link>
          ’na göz atın.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save("all")}
            className="btn-primary !py-2 !text-xs flex-1"
          >
            Tümünü kabul et
          </button>
          <button
            type="button"
            onClick={() => save("essential")}
            className="btn-ghost !py-2 !text-xs flex-1"
          >
            Sadece gerekli
          </button>
        </div>
      </div>
    </div>
  );
}
