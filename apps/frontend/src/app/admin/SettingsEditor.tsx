"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminImageUpload } from "./AdminImageUpload";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";
import { AdminCard, Field, Icon, Toast } from "./ui";
import { parseHeaderNavForEditor, type HeaderNavLink } from "@/lib/header-nav";

type Settings = {
  id: string;
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  fontFamily: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
  defaultMetaTitle: string | null;
  defaultMetaDesc: string | null;
  ogImageUrl: string | null;
  shippingFeeCents?: number;
  freeShippingThresholdCents?: number;
  taxRateBp?: number;
  taxIncluded?: boolean;
  lowStockThreshold?: number;
  whatsappEnabled?: boolean;
  whatsappNumber?: string | null;
  whatsappGreeting?: string | null;
  whatsappPhoneId?: string | null;
  whatsappAccessToken?: string | null;
  whatsappShippedTemplate?: string | null;
  whatsappTemplateLang?: string;
  popupEnabled?: boolean;
  popupTitle?: string | null;
  popupBody?: string | null;
  popupCtaLabel?: string | null;
  popupCtaHref?: string | null;
  popupImageUrl?: string | null;
  popupSize?: string | null;
  popupDismissBackdrop?: boolean;
  popupSessionOnly?: boolean;
  popupStorageKey?: string | null;
  topPromoLine1?: string;
  topPromoLine2?: string;
  topPromoLine3?: string;
  topPromoBgColor?: string;
  topPromoTextColor?: string;
  topPromoMarqueeDurationSec?: number;
  authPanelTitle?: string;
  authPanelSubtitle?: string;
  authPanelImageUrl?: string | null;
  authPanelGradientFrom?: string;
  authPanelGradientTo?: string;
  authPanelTextColor?: string;
  shopRailLeftEnabled?: boolean;
  shopRailLeftTitle?: string;
  shopRailLeftBody?: string;
  shopRailLeftCode?: string;
  shopRailLeftCtaLabel?: string;
  shopRailLeftCtaHref?: string;
  shopRailRightEnabled?: boolean;
  shopRailRightTitle?: string;
  shopRailRightBody?: string;
  shopRailRightCode?: string;
  shopRailRightCtaLabel?: string;
  shopRailRightCtaHref?: string;
  birthdayCouponAutomationEnabled?: boolean;
  contactNavLabel?: string | null;
  contactNavHref?: string | null;
  headerNav?: unknown;
};

const SOCIAL_KEYS = ["instagram", "facebook", "x", "youtube", "linkedin", "tiktok"] as const;
const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X (Twitter)",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

function ColorField({
  label,
  value,
  onChange,
  clearable = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clearable?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <label className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-slate-200 shadow-inner">
          <input
            type="color"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
          />
          <span
            className="h-full w-full"
            style={{ background: value || "transparent" }}
            aria-hidden
          />
        </label>
        <input
          className="input-soft flex-1 font-mono text-xs uppercase"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
        {clearable && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Temizle"
          >
            <Icon.X />
          </button>
        )}
      </div>
    </div>
  );
}

function NavLinkRowsEditor({
  title,
  hint,
  rows,
  onChange,
}: {
  title: string;
  hint: string;
  rows: HeaderNavLink[];
  onChange: (next: HeaderNavLink[]) => void;
}) {
  const add = () => onChange([...rows, { label: "", href: "", muted: false }]);
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    const a = next[i];
    const b = next[j];
    if (!a || !b) return;
    next[i] = b;
    next[j] = a;
    onChange(next);
  };
  const patch = (i: number, p: Partial<HeaderNavLink>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">Henüz satır yok — «Satır ekle» ile ekleyin.</p>
      ) : null}
      {rows.map((row, i) => (
        <div
          key={`${i}-${row.href}`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <Field label="Etiket" className="min-w-[8rem] flex-1">
            <input className="input-soft" value={row.label} onChange={(e) => patch(i, { label: e.target.value })} />
          </Field>
          <Field label="Adres (yol veya URL)" className="min-w-[10rem] flex-[1.2]">
            <input
              className="input-soft font-mono text-xs"
              value={row.href}
              onChange={(e) => patch(i, { href: e.target.value })}
              placeholder="/about"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs text-slate-600 sm:pb-2">
            <input
              type="checkbox"
              checked={Boolean(row.muted)}
              onChange={(e) => patch(i, { muted: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Soluk stil
          </label>
          <div className="flex gap-1 sm:ml-auto">
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs disabled:opacity-40"
              onClick={() => move(i, -1)}
              disabled={i === 0}
            >
              ↑
            </button>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs disabled:opacity-40"
              onClick={() => move(i, 1)}
              disabled={i === rows.length - 1}
            >
              ↓
            </button>
            <button type="button" className="btn-ghost px-2 py-1 text-xs text-rose-700" onClick={() => remove(i)}>
              Sil
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
        + Satır ekle
      </button>
    </div>
  );
}

export function SettingsEditor({ token }: { token: string }) {
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [accentColor, setAccentColor] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactNavLabel, setContactNavLabel] = useState("");
  const [contactNavHref, setContactNavHref] = useState("");
  const [headerNavBefore, setHeaderNavBefore] = useState<HeaderNavLink[]>([]);
  const [headerNavAfter, setHeaderNavAfter] = useState<HeaderNavLink[]>([]);
  const [social, setSocial] = useState<Record<string, string>>({});
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [freeThreshold, setFreeThreshold] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [waEnabled, setWaEnabled] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [waGreeting, setWaGreeting] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waShippedTemplate, setWaShippedTemplate] = useState("");
  const [waTemplateLang, setWaTemplateLang] = useState("tr");
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupBody, setPopupBody] = useState("");
  const [popupCtaLabel, setPopupCtaLabel] = useState("");
  const [popupCtaHref, setPopupCtaHref] = useState("");
  const [popupImageUrl, setPopupImageUrl] = useState("");
  const [popupSize, setPopupSize] = useState("md");
  const [popupDismissBackdrop, setPopupDismissBackdrop] = useState(true);
  const [popupSessionOnly, setPopupSessionOnly] = useState(false);
  const [popupStorageKey, setPopupStorageKey] = useState("1");
  const [topPromoLine1, setTopPromoLine1] = useState("");
  const [topPromoLine2, setTopPromoLine2] = useState("");
  const [topPromoLine3, setTopPromoLine3] = useState("");
  const [topPromoBgColor, setTopPromoBgColor] = useState("#0f172a");
  const [topPromoTextColor, setTopPromoTextColor] = useState("#f8fafc");
  const [topPromoMarqueeDurationSec, setTopPromoMarqueeDurationSec] = useState(50);
  const [authPanelTitle, setAuthPanelTitle] = useState("Her adımda kalite.");
  const [authPanelSubtitle, setAuthPanelSubtitle] = useState("");
  const [authPanelImageUrl, setAuthPanelImageUrl] = useState("");
  const [authPanelGradientFrom, setAuthPanelGradientFrom] = useState("#334155");
  const [authPanelGradientTo, setAuthPanelGradientTo] = useState("#020617");
  const [authPanelTextColor, setAuthPanelTextColor] = useState("#ffffff");
  const [shopRailLeftEnabled, setShopRailLeftEnabled] = useState(false);
  const [shopRailLeftTitle, setShopRailLeftTitle] = useState("");
  const [shopRailLeftBody, setShopRailLeftBody] = useState("");
  const [shopRailLeftCode, setShopRailLeftCode] = useState("");
  const [shopRailLeftCtaLabel, setShopRailLeftCtaLabel] = useState("");
  const [shopRailLeftCtaHref, setShopRailLeftCtaHref] = useState("");
  const [shopRailRightEnabled, setShopRailRightEnabled] = useState(false);
  const [shopRailRightTitle, setShopRailRightTitle] = useState("");
  const [shopRailRightBody, setShopRailRightBody] = useState("");
  const [shopRailRightCode, setShopRailRightCode] = useState("");
  const [shopRailRightCtaLabel, setShopRailRightCtaLabel] = useState("");
  const [shopRailRightCtaHref, setShopRailRightCtaHref] = useState("");
  const [birthdayCouponAutomationEnabled, setBirthdayCouponAutomationEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const s = (await adminFetch("/settings/admin", token)) as Settings;
      setSiteName(s.siteName ?? "");
      setLogoUrl(s.logoUrl ?? "");
      setFaviconUrl(s.faviconUrl ?? "");
      setPrimaryColor(s.primaryColor ?? "#0f172a");
      setSecondaryColor(s.secondaryColor ?? "#3b82f6");
      setAccentColor(s.accentColor ?? "");
      setFontFamily(s.fontFamily ?? "");
      setContactEmail(s.contactEmail ?? "");
      setContactPhone(s.contactPhone ?? "");
      setAddress(s.address ?? "");
      setContactNavLabel(s.contactNavLabel ?? "");
      setContactNavHref(s.contactNavHref ?? "");
      const hn = parseHeaderNavForEditor(s.headerNav);
      setHeaderNavBefore(hn.beforeCategories);
      setHeaderNavAfter(hn.afterCategories);
      setSocial((s.socialLinks ?? {}) as Record<string, string>);
      setMetaTitle(s.defaultMetaTitle ?? "");
      setMetaDesc(s.defaultMetaDesc ?? "");
      setOgImageUrl(s.ogImageUrl ?? "");
      setShippingFee((s.shippingFeeCents ?? 0) / 100);
      setFreeThreshold((s.freeShippingThresholdCents ?? 0) / 100);
      setTaxRate((s.taxRateBp ?? 0) / 100);
      setTaxIncluded(s.taxIncluded ?? true);
      setLowStockThreshold(s.lowStockThreshold ?? 5);
      setWaEnabled(Boolean(s.whatsappEnabled));
      setWaNumber(s.whatsappNumber ?? "");
      setWaGreeting(s.whatsappGreeting ?? "");
      setWaPhoneId(s.whatsappPhoneId ?? "");
      setWaAccessToken(s.whatsappAccessToken ?? "");
      setWaShippedTemplate(s.whatsappShippedTemplate ?? "");
      setWaTemplateLang(s.whatsappTemplateLang ?? "tr");
      setPopupEnabled(Boolean(s.popupEnabled));
      setPopupTitle(s.popupTitle ?? "");
      setPopupBody(s.popupBody ?? "");
      setPopupCtaLabel(s.popupCtaLabel ?? "");
      setPopupCtaHref(s.popupCtaHref ?? "");
      setPopupImageUrl(s.popupImageUrl ?? "");
      setPopupSize(s.popupSize ?? "md");
      setPopupDismissBackdrop(s.popupDismissBackdrop !== false);
      setPopupSessionOnly(Boolean(s.popupSessionOnly));
      setPopupStorageKey(s.popupStorageKey ?? "1");
      setTopPromoLine1(s.topPromoLine1 ?? "");
      setTopPromoLine2(s.topPromoLine2 ?? "");
      setTopPromoLine3(s.topPromoLine3 ?? "");
      setTopPromoBgColor(s.topPromoBgColor ?? "#0f172a");
      setTopPromoTextColor(s.topPromoTextColor ?? "#f8fafc");
      setTopPromoMarqueeDurationSec(
        typeof s.topPromoMarqueeDurationSec === "number" && !Number.isNaN(s.topPromoMarqueeDurationSec)
          ? s.topPromoMarqueeDurationSec
          : 50,
      );
      setShopRailLeftEnabled(Boolean(s.shopRailLeftEnabled));
      setShopRailLeftTitle(s.shopRailLeftTitle ?? "");
      setShopRailLeftBody(s.shopRailLeftBody ?? "");
      setShopRailLeftCode(s.shopRailLeftCode ?? "");
      setShopRailLeftCtaLabel(s.shopRailLeftCtaLabel ?? "");
      setShopRailLeftCtaHref(s.shopRailLeftCtaHref ?? "");
      setShopRailRightEnabled(Boolean(s.shopRailRightEnabled));
      setShopRailRightTitle(s.shopRailRightTitle ?? "");
      setShopRailRightBody(s.shopRailRightBody ?? "");
      setShopRailRightCode(s.shopRailRightCode ?? "");
      setShopRailRightCtaLabel(s.shopRailRightCtaLabel ?? "");
      setShopRailRightCtaHref(s.shopRailRightCtaHref ?? "");
      setBirthdayCouponAutomationEnabled(Boolean(s.birthdayCouponAutomationEnabled));
      setAuthPanelTitle(s.authPanelTitle ?? "Her adımda kalite.");
      setAuthPanelSubtitle(s.authPanelSubtitle ?? "");
      setAuthPanelImageUrl(s.authPanelImageUrl ?? "");
      setAuthPanelGradientFrom(s.authPanelGradientFrom ?? "#334155");
      setAuthPanelGradientTo(s.authPanelGradientTo ?? "#020617");
      setAuthPanelTextColor(s.authPanelTextColor ?? "#ffffff");
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const payload = {
        siteName: siteName.trim() || "Mağaza",
        logoUrl: logoUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
        primaryColor,
        secondaryColor,
        accentColor: accentColor.trim() || null,
        fontFamily: fontFamily.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        address: address.trim() || null,
        contactNavLabel: contactNavLabel.trim() || null,
        contactNavHref: contactNavHref.trim() || null,
        socialLinks: Object.fromEntries(
          Object.entries(social).filter(
            ([, v]) => typeof v === "string" && v.trim().length > 0,
          ),
        ),
        defaultMetaTitle: metaTitle.trim() || null,
        defaultMetaDesc: metaDesc.trim() || null,
        ogImageUrl: ogImageUrl.trim() || null,
        shippingFeeCents: Math.round(Math.max(0, Number(shippingFee) || 0) * 100),
        freeShippingThresholdCents: Math.round(Math.max(0, Number(freeThreshold) || 0) * 100),
        taxRateBp: Math.round(Math.max(0, Number(taxRate) || 0) * 100),
        taxIncluded,
        lowStockThreshold: Math.max(0, Math.floor(Number(lowStockThreshold) || 0)),
        whatsappEnabled: waEnabled,
        whatsappNumber: waNumber.trim() || null,
        whatsappGreeting: waGreeting.trim() || null,
        whatsappPhoneId: waPhoneId.trim() || null,
        whatsappAccessToken: waAccessToken.trim() || null,
        whatsappShippedTemplate: waShippedTemplate.trim() || null,
        whatsappTemplateLang: waTemplateLang.trim() || "tr",
        popupEnabled: popupEnabled,
        popupTitle: popupTitle.trim() || null,
        popupBody: popupBody.trim() || null,
        popupCtaLabel: popupCtaLabel.trim() || null,
        popupCtaHref: popupCtaHref.trim() || null,
        popupImageUrl: popupImageUrl.trim() || null,
        popupSize: popupSize || "md",
        popupDismissBackdrop: popupDismissBackdrop,
        popupSessionOnly: popupSessionOnly,
        popupStorageKey: popupStorageKey.trim() || "1",
        topPromoLine1: topPromoLine1.trim(),
        topPromoLine2: topPromoLine2.trim(),
        topPromoLine3: topPromoLine3.trim(),
        topPromoBgColor: topPromoBgColor.trim() || "#0f172a",
        topPromoTextColor: topPromoTextColor.trim() || "#f8fafc",
        topPromoMarqueeDurationSec: Math.min(
          300,
          Math.max(5, Math.floor(Number(topPromoMarqueeDurationSec) || 50)),
        ),
        shopRailLeftEnabled,
        shopRailLeftTitle: shopRailLeftTitle.trim(),
        shopRailLeftBody: shopRailLeftBody.trim(),
        shopRailLeftCode: shopRailLeftCode.trim(),
        shopRailLeftCtaLabel: shopRailLeftCtaLabel.trim(),
        shopRailLeftCtaHref: shopRailLeftCtaHref.trim(),
        shopRailRightEnabled,
        shopRailRightTitle: shopRailRightTitle.trim(),
        shopRailRightBody: shopRailRightBody.trim(),
        shopRailRightCode: shopRailRightCode.trim(),
        shopRailRightCtaLabel: shopRailRightCtaLabel.trim(),
        shopRailRightCtaHref: shopRailRightCtaHref.trim(),
        birthdayCouponAutomationEnabled,
        authPanelTitle: authPanelTitle.trim() || "Her adımda kalite.",
        authPanelSubtitle:
          authPanelSubtitle.trim() ||
          "Hassas üretim ve zamansız tasarımı bir araya getiren seçkin ürünler, tek tıkla kapınızda.",
        authPanelImageUrl: authPanelImageUrl.trim() || null,
        authPanelGradientFrom: authPanelGradientFrom.trim() || "#334155",
        authPanelGradientTo: authPanelGradientTo.trim() || "#020617",
        authPanelTextColor: authPanelTextColor.trim() || "#ffffff",
        headerNav: {
          beforeCategories: headerNavBefore.filter((r) => r.label.trim() && r.href.trim()),
          afterCategories: headerNavAfter.filter((r) => r.label.trim() && r.href.trim()),
        },
      };
      await adminFetch("/settings", token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }, [
    siteName,
    logoUrl,
    faviconUrl,
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    contactEmail,
    contactPhone,
    address,
    contactNavLabel,
    contactNavHref,
    social,
    metaTitle,
    metaDesc,
    ogImageUrl,
    shippingFee,
    freeThreshold,
    taxRate,
    taxIncluded,
    lowStockThreshold,
    waEnabled,
    waNumber,
    waGreeting,
    waPhoneId,
    waAccessToken,
    waShippedTemplate,
    waTemplateLang,
    popupEnabled,
    popupTitle,
    popupBody,
    popupCtaLabel,
    popupCtaHref,
    popupImageUrl,
    popupSize,
    popupDismissBackdrop,
    popupSessionOnly,
    popupStorageKey,
    topPromoLine1,
    topPromoLine2,
    topPromoLine3,
    topPromoBgColor,
    topPromoTextColor,
    topPromoMarqueeDurationSec,
    shopRailLeftEnabled,
    shopRailLeftTitle,
    shopRailLeftBody,
    shopRailLeftCode,
    shopRailLeftCtaLabel,
    shopRailLeftCtaHref,
    shopRailRightEnabled,
    shopRailRightTitle,
    shopRailRightBody,
    shopRailRightCode,
    shopRailRightCtaLabel,
    shopRailRightCtaHref,
    birthdayCouponAutomationEnabled,
    authPanelTitle,
    authPanelSubtitle,
    authPanelImageUrl,
    authPanelGradientFrom,
    authPanelGradientTo,
    authPanelTextColor,
    headerNavBefore,
    headerNavAfter,
    token,
  ]);

  return (
    <div className="space-y-6 pb-24">
      {error && <Toast kind="error">{error}</Toast>}
      {saved && <Toast kind="success">Ayarlar kaydedildi.</Toast>}

      <AdminCard
        title="Marka önizlemesi"
        description="Ayarların sitede nasıl görüneceğini hızlıca görün."
      >
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
          style={{
            backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            fontFamily: fontFamily || undefined,
          }}
        >
          <div
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-10 w-auto" />
            ) : (
              <span
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-base font-bold shadow-inner"
                aria-hidden
              >
                {(siteName || "S").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                {metaTitle?.trim() || siteName || "Site Adı"}
              </p>
              <p className="mt-1 truncate text-xl font-semibold tracking-tight">
                {siteName || "Mağaza"}
              </p>
              {metaDesc && (
                <p className="mt-1 max-w-xl truncate text-sm text-white/80">{metaDesc}</p>
              )}
            </div>
            {accentColor && (
              <span
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"
                title={accentColor}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: accentColor }}
                  aria-hidden
                />
                Vurgu
              </span>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Kimlik" description="Site adı, logo ve yazı tipi.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Site adı">
            <input
              className="input-soft"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </Field>
          <Field label="Font ailesi (CSS)" hint="Örn: Inter, system-ui, sans-serif">
            <input
              className="input-soft"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            />
          </Field>
          <AdminImageUpload
            token={token}
            label="Logo"
            value={logoUrl}
            onChange={setLogoUrl}
            hint="PNG veya SVG önerilir."
          />
          <AdminImageUpload
            token={token}
            label="Favicon"
            value={faviconUrl}
            onChange={setFaviconUrl}
            accept="image/x-icon,image/vnd.microsoft.icon,.ico,image/png,image/svg+xml"
            hint=".ico veya küçük PNG."
          />
        </div>
      </AdminCard>

      <AdminCard title="Marka renkleri" description="Tema renkleri tüm siteyi etkiler.">
        <div className="grid gap-3 md:grid-cols-3">
          <ColorField label="Birincil" value={primaryColor} onChange={setPrimaryColor} />
          <ColorField label="İkincil" value={secondaryColor} onChange={setSecondaryColor} />
          <ColorField label="Vurgu (opsiyonel)" value={accentColor} onChange={setAccentColor} clearable />
        </div>
      </AdminCard>

      <AdminCard title="İletişim" description="Footer ve iletişim sayfasında görünür.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="E-posta">
            <input
              type="email"
              className="input-soft"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </Field>
          <Field label="Telefon">
            <input
              className="input-soft"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Adres" className="mt-3">
          <textarea
            rows={3}
            className="input-soft resize-y"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </AdminCard>

      <AdminCard
        title="Üst menü bağlantıları"
        description="Kategori şeridinde: soldaki ve sağdaki ek bağlantılar. «Bize ulaşın» satırı her zaman en sonda ve aşağıdaki alandan yönetilir."
      >
        <NavLinkRowsEditor
          title="Kategorilerden önce"
          hint="Örn. Hakkımızda — vitrin kategorilerinin solunda listelenir."
          rows={headerNavBefore}
          onChange={setHeaderNavBefore}
        />
        <NavLinkRowsEditor
          title="Kategorilerden sonra"
          hint="Örn. 3D baskı hizmeti — iletişim satırından önce; sırayı oklarla değiştirin."
          rows={headerNavAfter}
          onChange={setHeaderNavAfter}
        />
      </AdminCard>

      <AdminCard
        title="Menü: Bize ulaşın"
        description="Üst menü ve footer’daki iletişim bağlantısı. Boş bırakırsanız varsayılan metin ve /contact kullanılır."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Bağlantı metni" hint="Örn. Bize ulaşın, İletişim">
            <input
              className="input-soft"
              value={contactNavLabel}
              onChange={(e) => setContactNavLabel(e.target.value)}
              placeholder="Bize ulaşın"
            />
          </Field>
          <Field label="Bağlantı adresi" hint="Site içi yol veya tam URL. Örn. /contact veya /about">
            <input
              className="input-soft font-mono text-sm"
              value={contactNavHref}
              onChange={(e) => setContactNavHref(e.target.value)}
              placeholder="/contact"
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Sosyal medya" description="Boş bırakılan alanlar gösterilmez.">
        <div className="grid gap-3 md:grid-cols-2">
          {SOCIAL_KEYS.map((k) => (
            <Field key={k} label={SOCIAL_LABELS[k] ?? k}>
              <input
                className="input-soft"
                value={social[k] ?? ""}
                onChange={(e) => setSocial((s) => ({ ...s, [k]: e.target.value }))}
                placeholder="https://..."
              />
            </Field>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Kargo"
        description="Sabit kargo ücreti ve ücretsiz kargo eşiği. Eşik üstündeki sepetler kargosuz gider."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Kargo ücreti (₺)" hint="0 girerseniz kargo ücretsizdir.">
            <input
              type="number"
              min={0}
              step="0.01"
              className="input-soft"
              value={shippingFee}
              onChange={(e) => setShippingFee(Number(e.target.value))}
            />
          </Field>
          <Field
            label="Ücretsiz kargo eşiği (₺)"
            hint="0 girerseniz eşik yok, her zaman kargo alınır."
          >
            <input
              type="number"
              min={0}
              step="0.01"
              className="input-soft"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(Number(e.target.value))}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Şehir veya ülke bazlı kurallar eklemek için <em>Kargo Matrisi</em> sekmesini kullanın;
          eşleşme olduğunda buradaki varsayılan ücret devre dışı kalır.
        </p>
      </AdminCard>

      <AdminCard
        title="KDV ve Stok"
        description="KDV oranı, KDV dahil/hariç davranışı ve stok uyarı eşiği."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="KDV oranı (%)" hint="Örn. 20 girerseniz %20 KDV uygulanır (0 = KDV yok).">
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              className="input-soft"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
          </Field>
          <Field
            label="KDV davranışı"
            hint="Dahil: fiyatlar KDV içerir. Hariç: KDV toplama eklenir."
          >
            <select
              className="input-soft"
              value={taxIncluded ? "included" : "excluded"}
              onChange={(e) => setTaxIncluded(e.target.value === "included")}
            >
              <option value="included">Fiyatlara KDV dahil</option>
              <option value="excluded">KDV hariç (toplama ekle)</option>
            </select>
          </Field>
          <Field label="Stok uyarı eşiği" hint="Ürün bazlı eşik tanımlanmamışsa bu kullanılır.">
            <input
              type="number"
              min={0}
              step="1"
              className="input-soft"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard
        title="WhatsApp"
        description="Sitede yüzen WhatsApp butonu ve kargoya verildi bildirimleri için ayarlar."
      >
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={waEnabled}
            onChange={(e) => setWaEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="font-semibold text-slate-900">WhatsApp etkin</span>
            <span className="ml-2 text-xs text-slate-500">
              Kapalıyken ne buton ne de otomatik bildirim çalışır.
            </span>
          </span>
        </label>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field
            label="Mağaza numarası"
            hint="Uluslararası formatta (ör. 905551234567). wa.me linki bu numarayı kullanır."
          >
            <input
              className="input-soft"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="905551234567"
            />
          </Field>
          <Field
            label="Butonun hazır mesajı"
            hint="Ziyaretçi butona tıkladığında WhatsApp'a bu metinle yönlenir."
          >
            <input
              className="input-soft"
              value={waGreeting}
              onChange={(e) => setWaGreeting(e.target.value)}
              placeholder="Merhaba, ürünleriniz hakkında bilgi almak istiyorum."
            />
          </Field>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Otomatik kargo bildirimi (Meta WhatsApp Cloud API)
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Aşağıdaki alanları doldurursanız sipariş <em>SHIPPED</em> olarak işaretlendiğinde ve
            takip numarası güncellendiğinde müşteriye otomatik WhatsApp mesajı gönderilir.
            Boşsa sistem bunun yerine geliştirici günlüğüne bir <code>wa.me</code> linki yazar.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="phone_number_id">
              <input
                className="input-soft font-mono text-xs"
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
                placeholder="123456789012345"
              />
            </Field>
            <Field label="Access token">
              <input
                type="password"
                className="input-soft font-mono text-xs"
                value={waAccessToken}
                onChange={(e) => setWaAccessToken(e.target.value)}
                placeholder="EAA…"
              />
            </Field>
            <Field
              label="Şablon adı"
              hint="Meta tarafından onaylı bir body şablonu (örn. order_shipped)."
            >
              <input
                className="input-soft"
                value={waShippedTemplate}
                onChange={(e) => setWaShippedTemplate(e.target.value)}
                placeholder="order_shipped"
              />
            </Field>
            <Field label="Şablon dili" hint="Örn. tr, en, en_US">
              <input
                className="input-soft"
                value={waTemplateLang}
                onChange={(e) => setWaTemplateLang(e.target.value)}
                placeholder="tr"
              />
            </Field>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Şablonun gövdesi 3 parametre almalıdır: müşteri adı, sipariş kısa kodu (ilk 8 hane),
            takip numarası. Kargo firmasını 4. parametre olarak eklerseniz şablon mevcutsa
            gönderilir.
          </p>
        </div>
      </AdminCard>

      <AdminCard
        title="Üst promosyon şeridi"
        description="Masaüstü görünümde, header'ın hemen üstündeki üçlü metin. Renkler ve metinler buradan yönetilir (mobilde bu şerit gizlidir)."
      >
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-medium"
          style={{ background: topPromoBgColor, color: topPromoTextColor }}
        >
          <span className="max-w-[32%] truncate opacity-90">{topPromoLine1 || "—"}</span>
          <span className="max-w-[32%] truncate opacity-90">{topPromoLine2 || "—"}</span>
          <span className="max-w-[32%] truncate opacity-90">{topPromoLine3 || "—"}</span>
        </div>
        <div className="grid gap-3">
          <Field label="1. metin" hint="Örn: Havale/EFT indirim mesajı">
            <input
              className="input-soft"
              value={topPromoLine1}
              onChange={(e) => setTopPromoLine1(e.target.value)}
            />
          </Field>
          <Field label="2. metin" hint="Örn: Ücretsiz kargo eşiği">
            <input
              className="input-soft"
              value={topPromoLine2}
              onChange={(e) => setTopPromoLine2(e.target.value)}
            />
          </Field>
          <Field label="3. metin" hint="Örn: Taksit bilgisi">
            <input
              className="input-soft"
              value={topPromoLine3}
              onChange={(e) => setTopPromoLine3(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ColorField label="Şerit arka plan" value={topPromoBgColor} onChange={setTopPromoBgColor} />
          <ColorField label="Şerit metin rengi" value={topPromoTextColor} onChange={setTopPromoTextColor} />
        </div>
        <div className="mt-3">
          <Field
            label="Kayan metin hızı (saniye / tur)"
            hint="Bir turun (aynı noktaya dönme) süresi. Daha yüksek = daha yavaş. 5–300 arası; örnek: 30 hızlı, 50 orta, 100 yavaş."
          >
            <input
              type="number"
              className="input-soft"
              min={5}
              max={300}
              step={1}
              value={topPromoMarqueeDurationSec}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                setTopPromoMarqueeDurationSec(Number.isNaN(n) ? 50 : n);
              }}
              onBlur={() =>
                setTopPromoMarqueeDurationSec((v) => Math.min(300, Math.max(5, Math.round(v) || 50)))
              }
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard
        title="Pazarlama — doğum günü otomasyonu"
        description="Açıkken yönetici veya dış cron, Kampanya ekranındaki “Doğum günü işini çalıştır” ile önümüzdeki 7 gün içinde doğum günü olan izinli müşterilere yılda bir kez %10 kupon e-postası gönderebilir."
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
            checked={birthdayCouponAutomationEnabled}
            onChange={(e) => setBirthdayCouponAutomationEnabled(e.target.checked)}
          />
          <span>
            <span className="font-semibold">Doğum günü kuponu otomasyonunu etkinleştir</span>
            <span className="mt-1 block text-xs text-slate-500">
              Kapalıyken “Çalıştır” isteği yanıt verir ancak işlem yapmaz. Açtıktan sonra kaydedin; ardından Pazarlama
              sekmesinden veya harici zamanlayıcıdan tetikleyin.
            </span>
          </span>
        </label>
      </AdminCard>

      <AdminCard
        title="Mağaza — yan kampanyalar (masaüstü)"
        description="/shop ve ürün detayında, geniş ekranda (xl ve üzeri) içeriğin sol ve sağında. Kendi indirim / kod / CTA alanlarınız; dış reklam değildir. Mobilde gösterilmez."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={shopRailLeftEnabled}
                onChange={(e) => setShopRailLeftEnabled(e.target.checked)}
              />
              Sol sütun aktif
            </label>
            <p className="mb-3 mt-1 text-[11px] text-slate-500">Sol taraf (masaüstü)</p>
            <div className="grid gap-3">
              <Field label="Başlık (küçük)" hint="Örn. Kış indirimi">
                <input
                  className="input-soft"
                  value={shopRailLeftTitle}
                  onChange={(e) => setShopRailLeftTitle(e.target.value)}
                />
              </Field>
              <Field label="Metin" hint="Kampanya açıklaması">
                <textarea
                  rows={3}
                  className="input-soft resize-y"
                  value={shopRailLeftBody}
                  onChange={(e) => setShopRailLeftBody(e.target.value)}
                />
              </Field>
              <Field label="Kod" hint="Örn. KIS15 — sitede kopyalama alanı">
                <input
                  className="input-soft font-mono"
                  value={shopRailLeftCode}
                  onChange={(e) => setShopRailLeftCode(e.target.value)}
                  placeholder="KIS2026"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="CTA metni" hint="Örn. Ürünlere git">
                  <input
                    className="input-soft"
                    value={shopRailLeftCtaLabel}
                    onChange={(e) => setShopRailLeftCtaLabel(e.target.value)}
                  />
                </Field>
                <Field label="CTA linki" hint="/shop veya https://...">
                  <input
                    className="input-soft"
                    value={shopRailLeftCtaHref}
                    onChange={(e) => setShopRailLeftCtaHref(e.target.value)}
                    placeholder="/shop"
                  />
                </Field>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={shopRailRightEnabled}
                onChange={(e) => setShopRailRightEnabled(e.target.checked)}
              />
              Sağ sütun aktif
            </label>
            <p className="mb-3 mt-1 text-[11px] text-slate-500">Sağ taraf (masaüstü)</p>
            <div className="grid gap-3">
              <Field label="Başlık (küçük)">
                <input
                  className="input-soft"
                  value={shopRailRightTitle}
                  onChange={(e) => setShopRailRightTitle(e.target.value)}
                />
              </Field>
              <Field label="Metin">
                <textarea
                  rows={3}
                  className="input-soft resize-y"
                  value={shopRailRightBody}
                  onChange={(e) => setShopRailRightBody(e.target.value)}
                />
              </Field>
              <Field label="Kod">
                <input
                  className="input-soft font-mono"
                  value={shopRailRightCode}
                  onChange={(e) => setShopRailRightCode(e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="CTA metni">
                  <input
                    className="input-soft"
                    value={shopRailRightCtaLabel}
                    onChange={(e) => setShopRailRightCtaLabel(e.target.value)}
                  />
                </Field>
                <Field label="CTA linki">
                  <input
                    className="input-soft"
                    value={shopRailRightCtaHref}
                    onChange={(e) => setShopRailRightCtaHref(e.target.value)}
                    placeholder="https://"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Giriş / kayıt — sol panel"
        description="/hesap/giris ve /hesap/kayit sayfalarında solda gösterilen görsel alan: başlık, açıklama, isteğe bağlı arka plan görseli ve degrade renkleri."
      >
        <div className="mb-4 grid gap-2 overflow-hidden rounded-2xl border border-slate-200 md:grid-cols-2">
          <div
            className="relative min-h-[140px] p-4 text-sm text-white"
            style={{
              background: `linear-gradient(135deg, ${authPanelGradientFrom}, ${authPanelGradientTo})`,
            }}
          >
            {authPanelImageUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{ backgroundImage: `url(${authPanelImageUrl})` }}
                aria-hidden
              />
            ) : null}
            {authPanelImageUrl ? (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
            ) : null}
            <div className="relative z-10" style={{ color: authPanelTextColor }}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Marka adı</p>
              <p className="mt-1 font-semibold leading-snug">{authPanelTitle || "Başlık"}</p>
              <p className="mt-2 text-xs leading-relaxed opacity-90 [text-wrap:pretty]">
                {(authPanelSubtitle || "Alt metin önizlemesi").slice(0, 120)}
                {(authPanelSubtitle?.length || 0) > 120 ? "…" : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          <Field label="Panel başlığı">
            <input
              className="input-soft"
              value={authPanelTitle}
              onChange={(e) => setAuthPanelTitle(e.target.value)}
            />
          </Field>
          <Field label="Panel açıklaması">
            <textarea
              rows={3}
              className="input-soft resize-y"
              value={authPanelSubtitle}
              onChange={(e) => setAuthPanelSubtitle(e.target.value)}
            />
          </Field>
          <AdminImageUpload
            token={token}
            label="Arka plan görseli (isteğe bağlı)"
            value={authPanelImageUrl}
            onChange={setAuthPanelImageUrl}
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ColorField label="Degrade başlangıç" value={authPanelGradientFrom} onChange={setAuthPanelGradientFrom} />
          <ColorField label="Degrade bitiş" value={authPanelGradientTo} onChange={setAuthPanelGradientTo} />
          <ColorField label="Metin rengi" value={authPanelTextColor} onChange={setAuthPanelTextColor} />
        </div>
      </AdminCard>

      <AdminCard
        title="Promosyon popup"
        description="Ziyaretçilere kısa süre sonra açılan, boyutu ve buton linki ayarlanabilir bilgi penceresi. X, Escape veya arka plan (isteğe bağlı) ile kapanır."
      >
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={popupEnabled}
            onChange={(e) => setPopupEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-semibold text-slate-900">Popup göster</span>
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Başlık zorunludur. Metin, görsel veya buton linkinden en az biri önerilir. İç link için{" "}
          <code className="rounded bg-slate-100 px-1">/shop</code> gibi yol kullanın; dış link{" "}
          <code className="rounded bg-slate-100 px-1">https://…</code> yeni sekmede açılır.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Başlık">
            <input
              className="input-soft"
              value={popupTitle}
              onChange={(e) => setPopupTitle(e.target.value)}
              placeholder="Örn: Bahar indirimi başladı"
            />
          </Field>
          <Field label="Popup genişliği">
            <select
              className="input-soft"
              value={popupSize}
              onChange={(e) => setPopupSize(e.target.value)}
            >
              <option value="sm">Küçük (sm)</option>
              <option value="md">Orta (md)</option>
              <option value="lg">Geniş (lg)</option>
              <option value="xl">Çok geniş (xl)</option>
              <option value="full">Tam (büyük ekran)</option>
            </select>
          </Field>
        </div>
        <Field label="Metin" className="mt-3" hint="Satır sonları korunur. HTML yoktur.">
          <textarea
            rows={4}
            className="input-soft resize-y"
            value={popupBody}
            onChange={(e) => setPopupBody(e.target.value)}
            placeholder="Kampanya detayları…"
          />
        </Field>
        <div className="mt-3">
          <AdminImageUpload
            token={token}
            label="Görsel"
            value={popupImageUrl}
            onChange={setPopupImageUrl}
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Buton yazısı">
            <input
              className="input-soft"
              value={popupCtaLabel}
              onChange={(e) => setPopupCtaLabel(e.target.value)}
              placeholder="Kampanyayı gör"
            />
          </Field>
          <Field label="Buton linki (href)">
            <input
              className="input-soft"
              value={popupCtaHref}
              onChange={(e) => setPopupCtaHref(e.target.value)}
              placeholder="/shop veya https://…"
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={popupDismissBackdrop}
              onChange={(e) => setPopupDismissBackdrop(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Arka plana tıklayınca kapat
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={popupSessionOnly}
              onChange={(e) => setPopupSessionOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Yalnızca bu oturumda bir kez (sayfa yenilenene kadar tekrar gösterme)
          </label>
        </div>
        <Field
          label="Sürüm anahtarı"
          className="mt-3"
          hint="Aynı ziyaretçiye yeni kampanya göstermek için değeri değiştirip kaydedin (ör. 1 → 2)."
        >
          <input
            className="input-soft font-mono text-sm"
            value={popupStorageKey}
            onChange={(e) => setPopupStorageKey(e.target.value)}
            placeholder="1"
          />
        </Field>
      </AdminCard>

      <AdminCard title="SEO meta" description="Arama sonuçları ve paylaşım önizlemeleri.">
        <Field label="Varsayılan başlık">
          <input
            className="input-soft"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </Field>
        <Field label="Açıklama" className="mt-3">
          <textarea
            rows={3}
            className="input-soft resize-y"
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
          />
        </Field>
        <div className="mt-3">
          <AdminImageUpload
            token={token}
            label="Open Graph görseli"
            value={ogImageUrl}
            onChange={setOgImageUrl}
            hint="Sosyal paylaşımlarda kullanılır; geniş görsel önerilir."
          />
        </div>
      </AdminCard>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="btn-primary shadow-xl disabled:opacity-50"
        >
          <Icon.Check />
          {busy ? "Kaydediliyor…" : "Ayarları kaydet"}
        </button>
      </div>
    </div>
  );
}
