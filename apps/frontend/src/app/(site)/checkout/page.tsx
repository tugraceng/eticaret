"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  clearCartCompletely,
  lineKeyFor,
  readLocalCartFromStorage,
  syncCartFromStorage,
  writeLocalCartToStorage,
  type LocalCartLine,
} from "@/lib/cart-sync";
import { commerceBeginCheckout, commercePurchase } from "@/lib/commerce-analytics";
import { getCustomerEmail, getCustomerToken } from "@/lib/platform-session";
import { ProvinceDistrictSelect } from "@/components/forms/ProvinceDistrictSelect";
import { isTrProvinceDistrictValid } from "@/lib/tr-province-district";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutJumpNav } from "./_components/CheckoutJumpNav";
import { CheckoutPaymentTrustPanel } from "./_components/CheckoutPaymentTrustPanel";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";
import { ThumbImage } from "@/components/site/ThumbImage";

const PHONE_TR = /^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
const NEW_ADDRESS = "__new__";

type Line = LocalCartLine;
type Provider = {
  id: "MOCK" | "IYZICO" | "PAYTR" | "STRIPE" | "BANK_TRANSFER";
  name: string;
  enabled: boolean;
  ready: boolean;
  sandbox: boolean;
};
type BankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  branch?: string | null;
  notes?: string | null;
};
type MeAddress = {
  id: string;
  label: string | null;
  contactName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  district: string | null;
  city: string;
  postalCode: string;
  isDefault: boolean;
};
type Me = {
  email: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  customer: { addresses: MeAddress[] } | null;
};

type ShippingSettings = {
  shippingFeeCents: number;
  freeShippingThresholdCents: number;
  taxRateBp: number;
  taxIncluded: boolean;
};

type DiscountResult = {
  id: string;
  code: string;
  kind: "PERCENT" | "FIXED";
  value: number;
  discountCents: number;
  description?: string | null;
};

function mergeCartLines(lines: Line[]): Line[] {
  const map = new Map<string, Line>();
  for (const line of lines) {
    const key = line.lineKey || lineKeyFor(line.productId, line.productVariantId);
    const normalized = { ...line, lineKey: key };
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...normalized, quantity: Math.max(1, Number(line.quantity) || 1) });
      continue;
    }
    existing.quantity += Math.max(1, Number(line.quantity) || 1);
    if (typeof line.priceCents === "number") existing.priceCents = line.priceCents;
  }
  return Array.from(map.values());
}

function readCart(): Line[] {
  return readLocalCartFromStorage();
}

function writeCart(lines: Line[]) {
  writeLocalCartToStorage(lines);
}

function priceFmt(cents: number | undefined) {
  if (typeof cents !== "number") return "";
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function CheckoutInner() {
  const router = useRouter();

  // buyer & shipping
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Ev");

  // consents
  const [kvkk, setKvkk] = useState(false);
  const [mss, setMss] = useState(false);
  /** Misafir için: kampanya / fırsat e-postası izni (terk edilmiş sepet ve kampanyalar) */
  const [marketingCheckoutOptIn, setMarketingCheckoutOptIn] = useState(false);

  // saved addresses
  const [addresses, setAddresses] = useState<MeAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(NEW_ADDRESS);

  // payment
  const [providers, setProviders] = useState<Provider[]>([]);
  const [paymentProvider, setPaymentProvider] = useState<Provider["id"]>("IYZICO");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankInstructions, setBankInstructions] = useState<string | null>(null);

  // shipping & discount
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<DiscountResult | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponErr, setCouponErr] = useState<string | null>(null);

  // state
  const [error, setError] = useState<string | null>(null);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const checkoutTracked = useRef(false);

  useEffect(() => {
    const merged = mergeCartLines(readCart());
    setLines(merged);
    writeCart(merged);
    void (async () => {
      const fromServer = await syncCartFromStorage();
      if (fromServer) {
        const next = mergeCartLines(fromServer);
        setLines(next);
        writeCart(next);
      }
    })();
  }, []);

  const guestAbandonPayload = useMemo(
    () =>
      JSON.stringify(
        lines.map((l) => ({
          productId: l.productId,
          productVariantId: l.productVariantId,
          lineKey: l.lineKey,
          quantity: l.quantity,
          title: l.title,
          priceCents: typeof l.priceCents === "number" ? l.priceCents : 0,
          slug: l.slug,
        })),
      ),
    [lines],
  );

  useEffect(() => {
    if (loggedIn) return;
    if (!lines.length) return;
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return;
    const t = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(guestAbandonPayload) as Array<Record<string, unknown>>;
        void fetch(apiUrl("/cart/guest-abandon"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: em,
            marketingOptIn: marketingCheckoutOptIn,
            lines: parsed,
          }),
        }).catch(() => undefined);
      } catch {
        /* ignore */
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [loggedIn, email, marketingCheckoutOptIn, guestAbandonPayload, lines.length]);

  useEffect(() => {
    const pre = getCustomerEmail();
    if (pre) setEmail((e) => e || pre);
    const tok = getCustomerToken();
    setLoggedIn(Boolean(tok));

    if (tok) {
      void (async () => {
        try {
          const res = await fetch(apiUrl("/customers/me"), {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (!res.ok) return;
          const me = (await res.json()) as Me;
          setEmail((v) => v || me.email || "");
          setName((v) => v || me.name || "");
          setSurname((v) => v || me.surname || "");
          setPhone((v) => v || me.phone || "");
          const list = me.customer?.addresses ?? [];
          setAddresses(list);
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) {
            setSelectedAddressId(def.id);
            applyAddress(def);
          }
        } catch {
          // ignore
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(apiUrl("/settings"));
        if (!res.ok) return;
        const s = (await res.json()) as Partial<ShippingSettings>;
        setShippingSettings({
          shippingFeeCents: s.shippingFeeCents ?? 0,
          freeShippingThresholdCents: s.freeShippingThresholdCents ?? 0,
          taxRateBp: s.taxRateBp ?? 0,
          taxIncluded: s.taxIncluded ?? true,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  const [quotedShippingCents, setQuotedShippingCents] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [provRes, settingsRes, banksRes] = await Promise.all([
          fetch(apiUrl("/payments/providers")),
          fetch(apiUrl("/settings")),
          fetch(apiUrl("/bank-accounts")),
        ]);
        if (cancelled) return;
        if (provRes.ok) {
          const list = ((await provRes.json()) as Provider[]).filter((p) => p.id !== "MOCK");
          setProviders(list);
          const firstReady =
            list.find((p) => p.id === "IYZICO" && p.enabled && p.ready) ??
            list.find((p) => p.enabled && p.ready) ??
            list[0];
          if (firstReady) setPaymentProvider(firstReady.id);
        }
        if (settingsRes.ok) {
          const s = (await settingsRes.json()) as {
            bankTransferInstructions?: string | null;
          };
          setBankInstructions(s.bankTransferInstructions?.trim() || null);
        }
        if (banksRes.ok) {
          const banks = (await banksRes.json()) as BankAccount[];
          setBankAccounts(Array.isArray(banks) ? banks : []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function applyAddress(a: MeAddress) {
    if (a.contactName) {
      const [first, ...rest] = a.contactName.split(/\s+/);
      setName(first || "");
      setSurname(rest.join(" "));
    }
    if (a.phone) setPhone(a.phone);
    setLine1(a.line1 || "");
    setLine2(a.line2 || "");
    setDistrict(a.district || "");
    setCity(a.city || "");
    setPostalCode(a.postalCode || "");
  }

  function onSelectAddress(id: string) {
    setSelectedAddressId(id);
    if (id === NEW_ADDRESS) {
      setLine1("");
      setLine2("");
      setDistrict("");
      setCity("");
      setPostalCode("");
      return;
    }
    const a = addresses.find((x) => x.id === id);
    if (a) applyAddress(a);
  }

  const setQty = (lineKey: string, qty: number) => {
    const next = lines
      .map((l) => (l.lineKey === lineKey ? { ...l, quantity: Math.max(1, qty) } : l))
      .filter((l) => l.quantity > 0);
    setLines(next);
    writeCart(next);
  };

  const remove = (lineKey: string) => {
    const next = lines.filter((l) => l.lineKey !== lineKey);
    setLines(next);
    writeCart(next);
  };

  const moveLine = useCallback(
    (index: number, dir: -1 | 1) => {
      const to = index + dir;
      if (to < 0 || to >= lines.length) return;
      const next = [...lines];
      const [row] = next.splice(index, 1);
      next.splice(to, 0, row);
      setLines(next);
      writeCart(next);
    },
    [lines],
  );

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (l.priceCents ?? 0) * l.quantity, 0),
    [lines],
  );

  const isNewAddress = selectedAddressId === NEW_ADDRESS;

  useEffect(() => {
    const sa = Math.max(0, subtotal - (applied?.discountCents ?? 0));
    const qs = new URLSearchParams({
      country: "TR",
      subtotalCents: String(sa),
    });
    if (city.trim()) qs.set("city", city.trim());
    const ctrl = new AbortController();
    void (async () => {
      try {
        const res = await fetch(apiUrl(`/shipping-rates/quote?${qs.toString()}`), {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { shippingCents: number };
        setQuotedShippingCents(data.shippingCents);
      } catch {
        // ignore abort/network
      }
    })();
    return () => ctrl.abort();
  }, [city, subtotal, applied]);

  const shippingCents = useMemo(() => {
    if (typeof quotedShippingCents === "number") return quotedShippingCents;
    if (!shippingSettings) return 0;
    if (shippingSettings.shippingFeeCents <= 0) return 0;
    const sa = Math.max(0, subtotal - (applied?.discountCents ?? 0));
    if (
      shippingSettings.freeShippingThresholdCents > 0 &&
      sa >= shippingSettings.freeShippingThresholdCents
    )
      return 0;
    return shippingSettings.shippingFeeCents;
  }, [quotedShippingCents, shippingSettings, subtotal, applied]);

  const taxBp = shippingSettings?.taxRateBp ?? 0;
  const taxIncluded = shippingSettings?.taxIncluded ?? true;
  const taxBase = Math.max(0, subtotal - (applied?.discountCents ?? 0));
  const taxCents =
    taxBp > 0
      ? taxIncluded
        ? Math.round((taxBase * taxBp) / (10000 + taxBp))
        : Math.round((taxBase * taxBp) / 10000)
      : 0;

  const total =
    Math.max(0, subtotal - (applied?.discountCents ?? 0)) +
    shippingCents +
    (taxIncluded ? 0 : taxCents);

  useEffect(() => {
    if (lines.length === 0 || checkoutTracked.current) return;
    checkoutTracked.current = true;
    commerceBeginCheckout({
      value: subtotal / 100,
      items: lines.map((l) => ({
        item_id: l.productId,
        item_name: l.title,
        price: typeof l.priceCents === "number" ? l.priceCents / 100 : undefined,
        quantity: l.quantity,
      })),
    });
  }, [lines, subtotal]);

  async function applyCoupon() {
    setCouponErr(null);
    if (!couponInput.trim()) {
      setApplied(null);
      return;
    }
    setCouponBusy(true);
    try {
      const res = await fetch(apiUrl("/discounts/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotalCents: subtotal }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as DiscountResult;
      setApplied(data);
    } catch (e) {
      setApplied(null);
      setCouponErr(e instanceof Error ? e.message : "Kod geçersiz");
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setApplied(null);
    setCouponInput("");
    setCouponErr(null);
  }

  function validateStep1(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (lines.length === 0) errs.cart = "Sepetiniz boş.";
    if (!email.trim()) errs.email = "E-posta zorunlu.";
    if (!name.trim()) errs.name = "Ad zorunlu.";
    if (!surname.trim()) errs.surname = "Soyad zorunlu.";
    if (!PHONE_TR.test(phone.trim())) errs.phone = "Telefon TR cep formatında olmalı (05XX XXX XX XX).";
    if (identityNumber && !/^\d{11}$/.test(identityNumber.trim()))
      errs.identityNumber = "T.C. Kimlik No 11 haneli rakam olmalıdır.";
    if (!line1.trim()) errs.line1 = "Adres zorunlu.";
    if (!city.trim()) errs.city = "İl seçmelisiniz.";
    if (!district.trim()) errs.district = "İlçe seçmelisiniz.";
    else if (!isTrProvinceDistrictValid(city.trim(), district.trim()))
      errs.district = "Geçerli il ve ilçe seçin.";
    if (postalCode && !/^\d{5}$/.test(postalCode.trim())) errs.postalCode = "Posta kodu 5 haneli olmalıdır.";
    return errs;
  }

  function validateStep2(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!kvkk) errs.kvkk = "KVKK aydınlatma metnini onaylamanız gerekir.";
    if (!mss) errs.mss = "Mesafeli Satış Sözleşmesini onaylamanız gerekir.";
    return errs;
  }

  const mergedFieldErrors = { ...step1Errors };

  async function submit() {
    setError(null);
    const v1 = validateStep1();
    const v2 = validateStep2();
    setStep1Errors(v1);
    setStep2Errors(v2);
    if (Object.keys(v1).length) {
      requestAnimationFrame(() =>
        document.getElementById("checkout-adres")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
      return setError(`[Teslimat] ${Object.values(v1)[0]}`);
    }
    if (Object.keys(v2).length) {
      requestAnimationFrame(() =>
        document.getElementById("checkout-onaylar")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
      return;
    }

    setBusy(true);
    const token = getCustomerToken();
    try {
      const contactName = `${name.trim()} ${surname.trim()}`.trim();
      const orderBody = {
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          ...(l.productVariantId ? { productVariantId: l.productVariantId } : {}),
        })),
        guestEmail: email.trim(),
        contactName,
        contactPhone: phone.trim(),
        identityNumber: identityNumber.trim() || undefined,
        shippingLine1: line1.trim(),
        shippingLine2: line2.trim() || undefined,
        shippingDistrict: district.trim(),
        shippingCity: city.trim(),
        shippingPostalCode: postalCode.trim() || undefined,
        notes: notes.trim() || undefined,
        kvkkAccepted: kvkk,
        distanceSalesAccepted: mss,
        saveAddress: saveAddress && loggedIn && isNewAddress,
        addressLabel: isNewAddress ? addressLabel.trim() || undefined : undefined,
        discountCode: applied?.code,
        ...(paymentProvider === "BANK_TRANSFER" ? { paymentMethod: "BANK_TRANSFER" as const } : {}),
      };

      if (paymentProvider === "IYZICO") {
        const draftRes = await fetch(apiUrl("/orders/checkout-draft"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(orderBody),
        });
        if (!draftRes.ok) throw new Error(await draftRes.text());
        const { id: draftId } = (await draftRes.json()) as { id: string };
        const payRes = await fetch(apiUrl("/payments/iyzico/start"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            draftId,
            name,
            surname,
            email,
            phone,
            identityNumber: identityNumber.trim() || undefined,
            address: `${line1} ${line2}`.trim(),
            city,
          }),
        });
        if (!payRes.ok) throw new Error(await payRes.text());
        const { paymentPageUrl } = (await payRes.json()) as { paymentPageUrl: string };
        window.location.href = paymentPageUrl;
        return;
      }

      const res = await fetch(apiUrl("/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderBody),
      });
      if (!res.ok) throw new Error(await res.text());
      const order = (await res.json()) as { id: string };

      const purchaseValueCents = lines.reduce(
        (sum, l) => sum + (l.priceCents ?? 0) * Math.max(1, l.quantity),
        0,
      );
      commercePurchase({
        transaction_id: order.id,
        value: purchaseValueCents / 100,
        currency: "TRY",
        items: lines.map((l) => ({
          item_id: l.productId,
          item_name: l.title,
          price: typeof l.priceCents === "number" ? l.priceCents / 100 : undefined,
          quantity: l.quantity,
        })),
      });

      await clearCartCompletely();
      useCartStore.getState().replaceLines([]);
      router.push(`/orders/${order.id}?bank=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sipariş oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  // Empty cart state
  if (lines.length === 0) {
    return (
      <div className="surface-soft p-10 text-center">
        <p className="text-sm text-slate-500">Sepetiniz boş.</p>
        <Link
          href="/#urunler"
          className="btn-primary mt-4 inline-flex"
        >
          Alışverişe başla →
        </Link>
      </div>
    );
  }

  return (
    <div className="si-checkout-page grid w-full min-w-0 max-w-full gap-8 max-lg:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,390px)]">
      <div className="order-1 min-w-0 space-y-6">
        <div className="section-shell px-5 py-4">
          <CheckoutJumpNav />
        </div>

        <div id="checkout-adres" className="scroll-mt-28 space-y-6">
            {loggedIn && addresses.length > 0 && (
              <section className="card-soft p-6">
                <h2 className="text-lg font-semibold text-slate-900">Teslimat adresi</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Kayıtlı adreslerinizden birini seçin veya yeni bir adres girin.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-left transition ${
                        selectedAddressId === a.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="saved-address"
                        value={a.id}
                        checked={selectedAddressId === a.id}
                        onChange={() => onSelectAddress(a.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">
                            {a.label || "Adres"}
                            {a.isDefault && (
                              <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  selectedAddressId === a.id
                                    ? "bg-white/20"
                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                }`}
                              >
                                Varsayılan
                              </span>
                            )}
                          </p>
                        </div>
                        {a.contactName && <p className="mt-0.5 truncate">{a.contactName}</p>}
                        <p
                          className={`mt-1 line-clamp-2 text-xs ${
                            selectedAddressId === a.id ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          {[a.line1, a.line2, a.district, a.city, a.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </label>
                  ))}

                  <label
                    className={`flex cursor-pointer gap-3 rounded-2xl border border-dashed p-4 text-left transition ${
                      selectedAddressId === NEW_ADDRESS
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-address"
                      value={NEW_ADDRESS}
                      checked={selectedAddressId === NEW_ADDRESS}
                      onChange={() => onSelectAddress(NEW_ADDRESS)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold text-slate-900">+ Yeni adres kullan</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Farklı bir adrese gönderim yapmak için formu doldurun.
                      </p>
                    </div>
                  </label>
                </div>
              </section>
            )}

            <section className="card-soft p-6">
              <h2 className="text-lg font-semibold text-slate-900">Alıcı bilgileri</h2>
              {!loggedIn && (
                <p className="mt-1 text-xs text-slate-500">
                  Misafir olarak da sipariş verebilirsiniz. Hesabınız varsa{" "}
                  <Link href="/hesap/giris" className="link-underline font-semibold text-slate-900">
                    giriş yapın
                  </Link>{" "}
                  — adresleriniz ve geçmişiniz saklansın.
                </p>
              )}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Ad *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-soft mt-2"
                    autoComplete="given-name"
                  />
                  {step1Errors.name && <p className="mt-1 text-xs text-rose-600">{step1Errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Soyad *
                  </label>
                  <input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="input-soft mt-2"
                    autoComplete="family-name"
                  />
                  {step1Errors.surname && <p className="mt-1 text-xs text-rose-600">{step1Errors.surname}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-soft mt-2"
                    placeholder="ornek@alanadi.com"
                    autoComplete="email"
                  />
                  {step1Errors.email && <p className="mt-1 text-xs text-rose-600">{step1Errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-soft mt-2"
                    placeholder="05XX XXX XX XX"
                    autoComplete="tel"
                  />
                  {step1Errors.phone && <p className="mt-1 text-xs text-rose-600">{step1Errors.phone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    T.C. Kimlik No{" "}
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      opsiyonel
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, ""))}
                    className="input-soft mt-2"
                    placeholder="11 haneli (e-fatura için)"
                    autoComplete="off"
                  />
                  {step1Errors.identityNumber && (
                    <p className="mt-1 text-xs text-rose-600">{step1Errors.identityNumber}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="card-soft p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {loggedIn && addresses.length > 0 && !isNewAddress
                  ? "Teslimat adresi (seçili)"
                  : "Teslimat adresi"}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Adres (sokak, mahalle, no/kat/daire) *
                  </label>
                  <input
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    disabled={!isNewAddress && loggedIn && addresses.length > 0}
                    className="input-soft mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    autoComplete="address-line1"
                  />
                  {step1Errors.line1 && <p className="mt-1 text-xs text-rose-600">{step1Errors.line1}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Adres (ek){" "}
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      opsiyonel
                    </span>
                  </label>
                  <input
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    disabled={!isNewAddress && loggedIn && addresses.length > 0}
                    className="input-soft mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    autoComplete="address-line2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <ProvinceDistrictSelect
                    province={city}
                    district={district}
                    onProvinceChange={setCity}
                    onDistrictChange={setDistrict}
                    disabled={!isNewAddress && loggedIn && addresses.length > 0}
                    provinceError={step1Errors.city}
                    districtError={step1Errors.district}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Posta kodu
                  </label>
                  <input
                    inputMode="numeric"
                    maxLength={5}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                    disabled={!isNewAddress && loggedIn && addresses.length > 0}
                    className="input-soft mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    autoComplete="postal-code"
                  />
                  {step1Errors.postalCode && (
                    <p className="mt-1 text-xs text-rose-600">{step1Errors.postalCode}</p>
                  )}
                </div>
              </div>

              {loggedIn && isNewAddress && (
                <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    />
                    <span>Bu adresi hesabıma kaydet</span>
                  </label>
                  {saveAddress && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Adres etiketi
                      </label>
                      <input
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        className="input-soft mt-2"
                        placeholder="Ev, İş, Yazlık..."
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
        </div>

        <div id="checkout-sepet" className="scroll-mt-28 space-y-6">
          <>
            <section className="card-soft p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Sepetiniz</h2>
                <p className="text-xs text-slate-500">{totalQty} ürün</p>
              </div>
              <ul className="mt-5 divide-y divide-slate-100">
                {lines.map((l) => (
                  <li key={l.lineKey} className="flex items-center gap-3 py-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{l.title}</p>
                      {typeof l.priceCents === "number" && (
                        <p className="mt-0.5 text-xs text-slate-500">{priceFmt(l.priceCents)}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(l.lineKey)}
                        className="si-checkout-remove-btn mt-2"
                        aria-label={`${l.title} kaldır`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setQty(l.lineKey, l.quantity - 1)}
                        className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50"
                        aria-label="Azalt"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{l.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQty(l.lineKey, l.quantity + 1)}
                        className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50"
                        aria-label="Arttır"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card-soft p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Teslimat</h2>
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("checkout-adres")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Düzenle
                </button>
              </div>
              <div className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Alıcı
                  </p>
                  <p className="mt-1">
                    {name} {surname}
                  </p>
                  <p className="text-xs text-slate-500">{email}</p>
                  <p className="text-xs text-slate-500">{phone}</p>
                  {identityNumber && (
                    <p className="text-xs text-slate-500">T.C.: {identityNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Adres
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {[line1, line2].filter(Boolean).join("\n")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[district, city, postalCode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            </section>

            <section className="card-soft p-6">
              <h2 className="text-lg font-semibold text-slate-900">İndirim kodu</h2>
              <p className="mt-1 text-xs text-slate-500">
                Varsa kampanya kodunuzu girin ve uygula butonuna basın.
              </p>
              {applied ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm">
                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {applied.code}
                  </span>
                  <p className="flex-1 text-emerald-800">
                    {applied.kind === "PERCENT" ? `%${applied.value} indirim` : "İndirim"} uygulandı
                    — {priceFmt(applied.discountCents)}
                  </p>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="input-soft flex-1"
                    placeholder="HOSGELDIN20"
                    maxLength={40}
                  />
                  <button
                    type="button"
                    onClick={() => void applyCoupon()}
                    disabled={couponBusy || !couponInput.trim()}
                    className="btn-primary disabled:opacity-60"
                  >
                    {couponBusy ? "…" : "Uygula"}
                  </button>
                </div>
              )}
              {couponErr && (
                <p className="mt-2 text-xs font-medium text-rose-600">{couponErr}</p>
              )}
            </section>

            <section id="checkout-onaylar" className="card-soft scroll-mt-28 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Not ve onaylar</h2>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Sipariş notu (opsiyonel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-soft mt-2 min-h-[72px]"
                  placeholder="Kargo için ek bilgi, fatura isteği, vb."
                />
              </div>
              <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={marketingCheckoutOptIn}
                    onChange={(e) => setMarketingCheckoutOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    Kampanya, indirim ve hatırlatma iletileri için e-posta almak istiyorum. (İsteğe bağlı —
                    ticari elektronik ileti izni; dilediğinizde hesabınızdan kapatabilirsiniz.)
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={kvkk}
                    onChange={(e) => setKvkk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <Link
                      href="/kvkk"
                      target="_blank"
                      className="link-underline font-semibold text-slate-900"
                    >
                      KVKK Aydınlatma Metni
                    </Link>
                    &apos;ni okudum, kabul ediyorum. *
                  </span>
                </label>
                {step2Errors.kvkk && <p className="text-xs text-rose-400">{step2Errors.kvkk}</p>}
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={mss}
                    onChange={(e) => setMss(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <Link
                      href="/mesafeli-satis-sozlesmesi"
                      target="_blank"
                      className="link-underline font-semibold text-slate-900"
                    >
                      Mesafeli Satış Sözleşmesi
                    </Link>
                    &apos;ni okudum, kabul ediyorum. *
                  </span>
                </label>
                {step2Errors.mss && <p className="text-xs text-rose-400">{step2Errors.mss}</p>}
              </div>
            </section>
          </>
        </div>

        <div id="checkout-odeme" className="scroll-mt-28">
          <section className="card-soft p-6">
            <CheckoutPaymentTrustPanel paymentProvider={paymentProvider} />
            <h2 className="text-lg font-semibold text-slate-900">Ödeme yöntemi</h2>
            <p className="mt-1 text-xs text-slate-500">
              Listeden yöntemi seçin; onayladığınızda sipariş oluşturulur ve ödeme sayfasına güvenli
              şekilde yönlendirilirsiniz.
            </p>
            <div className="mt-5 grid gap-3">
              {providers.filter((p) => p.enabled && p.ready).length === 0 && (
                <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
                  Henüz yapılandırılmış bir ödeme yöntemi yok. Yönetici tarafından en az bir
                  sağlayıcı etkinleştirilmelidir.
                </p>
              )}
              {providers
                .filter((p) => p.enabled && p.ready)
                .map((p) => {
                  const selected = paymentProvider === p.id;
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={p.id}
                        checked={selected}
                        onChange={() => setPaymentProvider(p.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{p.name}</p>
                          {p.sandbox && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                selected
                                  ? "bg-white/20"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              }`}
                            >
                              Test modu
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 text-xs ${selected ? "text-white/80" : "text-slate-500"}`}>
                          {p.id === "IYZICO"
                            ? "Kredi kartı / banka kartı ile güvenli ödeme (İyzico)"
                            : p.id === "BANK_TRANSFER"
                              ? "Banka havalesi / EFT ile ödeme — onay sonrası sipariş işleme alınır"
                              : p.name}
                        </p>
                      </div>
                    </label>
                  );
                })}
            </div>

            {paymentProvider === "BANK_TRANSFER" && bankAccounts.length > 0 ? (
              <div className="mt-5 space-y-3 rounded-2xl border border-sky-200/40 bg-sky-950/20 p-4 text-sm">
                <p className="font-semibold text-slate-100">Banka hesapları</p>
                {bankInstructions ? (
                  <p className="text-xs leading-relaxed text-slate-400">{bankInstructions}</p>
                ) : null}
                {bankAccounts.map((b) => (
                  <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                    <p className="font-semibold text-slate-100">{b.bankName}</p>
                    <p className="mt-1 text-slate-300">{b.accountHolder}</p>
                    <p className="mt-1 font-mono text-sky-300/90">{b.iban}</p>
                    {b.branch ? <p className="mt-1 text-slate-500">Şube: {b.branch}</p> : null}
                  </div>
                ))}
                <p className="text-[11px] text-slate-500">
                  Açıklama kısmına sipariş numaranızı yazın. Ödeme onaylandıktan sonra siparişiniz hazırlanır.
                </p>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Siparişi onayla</p>
              <p className="mt-1">
                Butona tıkladığınızda{" "}
                {paymentProvider === "IYZICO"
                  ? "ödeme sayfasına yönlendirilirsiniz; sipariş yalnızca ödeme başarılı olduğunda oluşturulur."
                  : paymentProvider === "BANK_TRANSFER"
                    ? "siparişiniz «Ödeme bekleniyor» durumunda oluşturulur ve banka bilgileri gösterilir."
                    : "sipariş özeti sayfasına yönlendirilirsiniz."}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Şüpheli bir yönlendirme görürseniz işlemi durdurup müşteri hizmetleriyle doğrulayın.
              </p>
            </div>
          </section>
        </div>

        {Object.keys(mergedFieldErrors).length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">Formda düzeltilmesi gereken alanlar:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.values(mergedFieldErrors).map((msg, idx) => (
                <li key={`${msg}-${idx}`}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-200/90 bg-white/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:static sm:border-0 sm:bg-transparent sm:py-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/#urunler" className="btn-ghost order-2 !px-5 sm:order-1">
              ← Alışverişe dön
            </Link>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || providers.filter((p) => p.enabled && p.ready).length === 0}
              className="btn-primary order-1 min-h-[48px] sm:order-2 sm:!px-8 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Gönderiliyor…"
                : paymentProvider === "IYZICO"
                  ? "Güvenli ödemeye geç →"
                  : paymentProvider === "BANK_TRANSFER"
                    ? "Havale siparişi oluştur →"
                    : "Siparişi tamamla →"}
            </button>
          </div>
          <p className="text-center text-[10px] leading-relaxed text-slate-500 sm:text-left">
            Ödeme bölümünün altından siparişi tek seferde onaylarsınız. Kart bilgisi bu adımda istenmez;
            ödeme kuruluşunun sayfasında girilir. Zorunlu alanlar yukarıda işaretlenmiştir.
          </p>
        </div>
      </div>

      <aside className="order-2 min-w-0 w-full max-w-full space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="surface-soft si-checkout-summary w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-6">
          <section className="si-checkout-about" aria-labelledby="checkout-about-heading">
            <h3 id="checkout-about-heading" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Hakkımda
            </h3>
            {loggedIn ? (
              <div className="mt-2">
                <p className="text-sm font-semibold text-slate-900">
                  {[name, surname].filter(Boolean).join(" ").trim() || "Hesabınız"}
                </p>
                {email.trim() ? (
                  <p className="mt-1 break-all text-xs text-slate-600">{email.trim()}</p>
                ) : null}
                <Link
                  href="/hesap"
                  className="mt-2 inline-flex text-xs font-semibold text-sky-800 underline-offset-2 hover:underline"
                >
                  Profilimi görüntüle
                </Link>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-slate-800">Misafir olarak ödeme yapıyorsunuz.</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Teslimat ve fatura bilgileri siparişinizle birlikte kullanılır; hesap oluşturmadan devam edebilirsiniz.
                </p>
              </div>
            )}
          </section>

          <div className="mt-5 flex items-start justify-between gap-3 border-t border-slate-100 pt-5">
            <h2 className="text-lg font-semibold text-slate-900">Özet</h2>
            <Link
              href="/cart"
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            >
              Sepeti düzenle
            </Link>
          </div>
          <ul className="mt-4 max-h-[min(22rem,50vh)] space-y-3 overflow-y-auto overflow-x-hidden">
            {lines.map((l, idx) => (
              <li key={l.lineKey} className="flex min-w-0 gap-2 text-xs">
                <div className="hidden shrink-0 flex-col gap-0.5 pt-0.5 sm:flex">
                  <button
                    type="button"
                    onClick={() => moveLine(idx, -1)}
                    disabled={idx === 0}
                    className="grid h-6 w-6 place-items-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`${l.title} satırını yukarı taşı`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLine(idx, 1)}
                    disabled={idx === lines.length - 1}
                    className="grid h-6 w-6 place-items-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`${l.title} satırını aşağı taşı`}
                  >
                    ↓
                  </button>
                </div>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-12 sm:w-12">
                  {l.imageUrl ? (
                    <ThumbImage src={l.imageUrl} alt="" size={48} />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-slate-400">
                      —
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words font-medium leading-snug text-slate-800">{l.title}</p>
                  <div className="mt-1 flex min-w-0 items-start justify-between gap-2">
                    <p className="min-w-0 text-[11px] leading-snug text-slate-500">
                      <span className="rounded bg-slate-100 px-1 py-0.5 font-semibold text-slate-600">{l.quantity}×</span>{" "}
                      {typeof l.priceCents === "number" ? priceFmt(l.priceCents) : "—"} birim
                    </p>
                    <p className="shrink-0 whitespace-nowrap text-right font-medium tabular-nums text-slate-700">
                      {priceFmt((l.priceCents ?? 0) * l.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="si-checkout-totals mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 text-slate-600">
              <dt className="min-w-0">Ara toplam</dt>
              <dd className="shrink-0 whitespace-nowrap text-right tabular-nums">{priceFmt(subtotal)}</dd>
            </div>
            {applied && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 text-emerald-700">
                <dt className="min-w-0 break-words">
                  İndirim{" "}
                  <span className="ml-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                    {applied.code}
                  </span>
                </dt>
                <dd className="shrink-0 whitespace-nowrap text-right tabular-nums">− {priceFmt(applied.discountCents)}</dd>
              </div>
            )}
            {taxCents > 0 && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 text-slate-600">
                <dt className="min-w-0">
                  KDV{taxBp > 0 ? ` (%${(taxBp / 100).toFixed(0)})` : ""}
                  {taxIncluded ? (
                    <span className="ml-1 text-[10px] text-slate-400">· dahil</span>
                  ) : null}
                </dt>
                <dd className="shrink-0 whitespace-nowrap text-right tabular-nums">{priceFmt(taxCents)}</dd>
              </div>
            )}
            {shippingSettings &&
              shippingSettings.freeShippingThresholdCents > 0 &&
              shippingCents > 0 && (
                <p className="col-span-2 break-words text-[11px] leading-relaxed text-slate-500">
                  {priceFmt(
                    shippingSettings.freeShippingThresholdCents - (subtotal - (applied?.discountCents ?? 0)),
                  )}{" "}
                  daha eklerseniz kargo ücretsiz.
                </p>
              )}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 text-slate-600">
              <dt className="min-w-0">Kargo</dt>
              <dd className="shrink-0 whitespace-nowrap text-right tabular-nums">
                {shippingCents === 0 ? (
                  <span className="font-semibold text-emerald-700">Ücretsiz</span>
                ) : (
                  priceFmt(shippingCents)
                )}
              </dd>
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
              <dt className="min-w-0">Toplam</dt>
              <dd className="shrink-0 whitespace-nowrap text-right tabular-nums">{priceFmt(total)}</dd>
            </div>
          </dl>
          {loggedIn ? (
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Giriş yaptınız — sipariş hesabınıza bağlanır.
            </p>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              Hesabınız var mı?{" "}
              <Link href="/hesap/giris" className="link-underline font-semibold text-slate-900">
                Giriş yap
              </Link>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PageContainer as="main" className="py-10 sm:py-12">
      <div className="section-shell si-page-hero-compact">
        <PageHeader
          title="Ödeme"
          description="Teslimat, sepet özeti ve ödeme tek sayfada. Kart bilgileri yalnızca ödeme kuruluşunun güvenli sayfasında işlenir."
        />
      </div>
      <div className="mt-8 min-w-0 max-w-full overflow-x-hidden">
        <Suspense fallback={<p className="text-sm text-slate-600">Yükleniyor…</p>}>
          <CheckoutInner />
        </Suspense>
      </div>
    </PageContainer>
  );
}
