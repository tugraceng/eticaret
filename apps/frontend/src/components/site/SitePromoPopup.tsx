"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SITE_OVERLAY_RESET_EVENT } from "@/lib/reset-site-overlays";

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
  const pathname = usePathname();
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const sk = (storageKey ?? "1").trim() || "1";
  const widthClass = SIZE_CLASS[size ?? "md"] ?? SIZE_CLASS.md;
  const show = enabled && Boolean(title?.trim());

  const handleClose = useCallback(() => {
    setOpen(false);
    setDismissed(settingsId, sk, sessionOnly);
  }, [settingsId, sk, sessionOnly]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    if (isDismissed(settingsId, sk, sessionOnly)) return;
    const t = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [show, settingsId, sk, sessionOnly]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onReset = () => setOpen(false);
    window.addEventListener(SITE_OVERLAY_RESET_EVENT, onReset);
    return () => window.removeEventListener(SITE_OVERLAY_RESET_EVENT, onReset);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
    };
  }, [open, handleClose]);

  const goCta = useCallback(() => {
    const href = (ctaHref ?? "").trim();
    handleClose();
    if (!href) return;
    if (href.startsWith("/") && !href.startsWith("//")) {
      router.push(href);
    } else if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(href);
    }
  }, [ctaHref, handleClose, router]);

  if (!mounted || !show || !open || typeof document === "undefined") return null;

  const cta = (ctaLabel ?? "").trim();
  const href = (ctaHref ?? "").trim();

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        role="presentation"
        className={`absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] ${dismissBackdrop ? "cursor-pointer" : ""}`}
        onClick={dismissBackdrop ? handleClose : undefined}
        aria-hidden={!dismissBackdrop}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body?.trim() ? descId : undefined}
        className={`si-promo-panel surface-soft relative z-10 flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-2xl shadow-2xl ${widthClass}`}
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
          <button type="button" onClick={handleClose} className="btn-ghost !rounded-xl !px-4 !py-2.5">
            Kapat
          </button>
          {cta && href ? (
            <button type="button" onClick={goCta} className="btn-primary !rounded-xl !px-4 !py-2.5">
              {cta}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
