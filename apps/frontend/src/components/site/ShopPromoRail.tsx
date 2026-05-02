import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";
import { ShopPromoCodeCopy } from "./ShopPromoCodeCopy";

function t(s?: string | null) {
  return s?.trim() ?? "";
}

export function shopRailHasContent(settings: SiteSettings, side: "left" | "right"): boolean {
  const enabled = side === "left" ? settings.shopRailLeftEnabled : settings.shopRailRightEnabled;
  if (!enabled) return false;
  const title = side === "left" ? t(settings.shopRailLeftTitle) : t(settings.shopRailRightTitle);
  const body = side === "left" ? t(settings.shopRailLeftBody) : t(settings.shopRailRightBody);
  const code = side === "left" ? t(settings.shopRailLeftCode) : t(settings.shopRailRightCode);
  const ctaL = side === "left" ? t(settings.shopRailLeftCtaLabel) : t(settings.shopRailRightCtaLabel);
  const ctaH = side === "left" ? t(settings.shopRailLeftCtaHref) : t(settings.shopRailRightCtaHref);
  return Boolean(title || body || code || (ctaL && ctaH));
}

function CtaLink({ href, children }: { href: string; children: string }) {
  const isInt = href.startsWith("/");
  if (isInt) {
    return (
      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
    >
      {children}
    </a>
  );
}

export function ShopPromoRail({
  side,
  settings,
}: {
  side: "left" | "right";
  settings: SiteSettings;
}) {
  if (!shopRailHasContent(settings, side)) return null;

  const title = side === "left" ? t(settings.shopRailLeftTitle) : t(settings.shopRailRightTitle);
  const body = side === "left" ? t(settings.shopRailLeftBody) : t(settings.shopRailRightBody);
  const code = side === "left" ? t(settings.shopRailLeftCode) : t(settings.shopRailRightCode);
  const ctaL = side === "left" ? t(settings.shopRailLeftCtaLabel) : t(settings.shopRailRightCtaLabel);
  const ctaH = side === "left" ? t(settings.shopRailLeftCtaHref) : t(settings.shopRailRightCtaHref);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm">
      {title && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{title}</p>}
      {body && (
        <p className={`text-sm leading-relaxed text-slate-600 [text-wrap:pretty] ${title ? "mt-2" : ""}`}>
          {body}
        </p>
      )}
      {code ? <ShopPromoCodeCopy code={code} /> : null}
      {ctaL && ctaH ? <CtaLink href={ctaH}>{ctaL}</CtaLink> : null}
    </div>
  );
}
