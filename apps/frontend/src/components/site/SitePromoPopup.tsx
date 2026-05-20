"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const STORAGE_PREFIX = "platform_site_popup_dismissed_";

const SIZE_CLASS: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "w-[min(100vw-1.5rem,56rem)] max-w-[min(100vw-1.5rem,56rem)]",
};

export type SitePromoPopupProps = {
  settingsId: string;
  enabled: boolean;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  size: string | null;
  dismissBackdrop: boolean;
  sessionOnly: boolean;
  storageKey: string | null;
};

function storageKeyFull(settingsId: string, key: string) {
  return `${STORAGE_PREFIX}${settingsId}_${key}`;
}

function isDismissed(
  settingsId: string,
  storageKey: string,
  sessionOnly: boolean,
): boolean {
  if (typeof window === "undefined") return true;
  const k = storageKeyFull(settingsId, storageKey || "1");
  try {
    return Boolean(
      sessionOnly ? window.sessionStorage.getItem(k) : window.localStorage.getItem(k),
    );
  } catch {
    return false;
  }
}

function setDismissed(settingsId: string, storageKey: string, sessionOnly: boolean) {
  const k = storageKeyFull(settingsId, storageKey || "1");
  try {
    if (sessionOnly) window.sessionStorage.setItem(k, "1");
    else window.localStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
}

export function SitePromoPopup({
  settingsId,
  enabled,
  title,
  body,
  ctaLabel,
  ctaHref,
  imageUrl,
  size,
  dismissBackdrop,
  sessionOnly,
  storageKey,
}: SitePromoPopupProps) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const sk = (storageKey ?? "1").trim() || "1";
  const widthClass = SIZE_CLASS[size ?? "md"] ?? SIZE_CLASS.md;
  const show = enabled && Boolean(title?.trim());

  useEffect(() => {
    if (!show) return;
    if (isDismissed(settingsId, sk, sessionOnly)) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      window.requestAnimationFrame(() => setEntered(true));
    }, 450);
    return () => window.clearTimeout(t);
  }, [show, settingsId, sk, sessionOnly]);

  const handleClose = useCallback(() => {
    setEntered(false);
    window.setTimeout(() => {
      setOpen(false);
      setDismissed(settingsId, sk, sessionOnly);
    }, 200);
  }, [settingsId, sk, sessionOnly]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const goCta = useCallback(() => {
    const href = (ctaHref ?? "").trim();
    if (!href) {
      handleClose();
      return;
    }
    setDismissed(settingsId, sk, sessionOnly);
    setOpen(false);
    if (href.startsWith("/") && !href.startsWith("//")) {
      router.push(href);
    } else if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(href);
    }
  }, [ctaHref, handleClose, router, settingsId, sk, sessionOnly]);

  if (!show || !open) return null;

  const cta = (ctaLabel ?? "").trim();
  const href = (ctaHref ?? "").trim();

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={dismissBackdrop ? "Kapat" : undefined}
        disabled={!dismissBackdrop}
        onClick={() => dismissBackdrop && handleClose()}
        className={`absolute inset-0 bg-slate-950/55 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        } ${dismissBackdrop ? "cursor-pointer" : "cursor-default"}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body?.trim() ? descId : undefined}
        className={`si-promo-panel surface-soft relative flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-200 ease-out ${widthClass} ${
          entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="pr-2 text-lg font-semibold leading-snug text-slate-900">
            {title!.trim()}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Kapat"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {(imageUrl?.trim() || body?.trim()) ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {imageUrl?.trim() ? (
              <div className="mb-4 overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl.trim()} alt="" className="max-h-48 w-full object-cover sm:max-h-56" />
              </div>
            ) : null}
            {body?.trim() ? (
              <p id={descId} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {body.trim()}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleClose}
            className="btn-ghost !rounded-xl !px-4 !py-2.5"
          >
            Kapat
          </button>
          {cta && href ? (
            <button
              type="button"
              onClick={goCta}
              className="btn-primary !rounded-xl !px-4 !py-2.5"
            >
              {cta}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
