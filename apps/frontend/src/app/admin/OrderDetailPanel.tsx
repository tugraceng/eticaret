"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";

type OrderDetail = {
  id: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  trackingNumber: string | null;
  carrier?: string | null;
  paymentMethod?: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  identityNumber: string | null;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingDistrict: string | null;
  shippingCity: string;
  shippingPostalCode: string | null;
  notes: string | null;
  guestEmail: string | null;
  customer?: { id: string; email: string; name: string | null; surname: string | null; phone: string | null } | null;
  items: Array<{
    id?: string;
    titleSnapshot: string;
    quantity: number;
    unitPriceCents: number;
    productVariantId?: string | null;
    variantLabelSnapshot?: string | null;
  }>;
};

function priceFmt(cents: number, currency = "TRY") {
  return (cents / 100).toLocaleString("tr-TR", { style: "currency", currency });
}

export function OrderDetailPanel({
  orderId,
  token,
  onClose,
  onUpdated,
}: {
  orderId: string;
  token: string;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [data, setData] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = (await adminFetch(`/orders/admin/${orderId}`, token)) as OrderDetail;
      setData(d);
      setContactName(d.contactName ?? "");
      setContactPhone(d.contactPhone ?? "");
      setLine1(d.shippingLine1 ?? "");
      setLine2(d.shippingLine2 ?? "");
      setDistrict(d.shippingDistrict ?? "");
      setCity(d.shippingCity ?? "");
      setPostal(d.shippingPostalCode ?? "");
      setTracking(d.trackingNumber ?? "");
      setCarrier(d.carrier ?? "");
      setNotes(d.notes ?? "");
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Yüklenemedi");
      if (msg) setError(msg);
    }
  }, [orderId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await adminFetch(`/orders/admin/${orderId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          contactName,
          contactPhone,
          shippingLine1: line1,
          shippingLine2: line2,
          shippingDistrict: district,
          shippingCity: city,
          shippingPostalCode: postal,
          trackingNumber: tracking,
          carrier: carrier || null,
          notes,
        }),
      });
      setSaved(true);
      onUpdated?.();
      await load();
      window.setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Kaydedilemedi");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 p-0 backdrop-blur-sm" role="dialog" aria-modal>
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl sm:max-w-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sipariş</p>
            <h3 className="text-lg font-semibold text-slate-900">
              {data ? `#${data.id.slice(0, 8)}…` : "Yükleniyor…"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Kapat ✕
          </button>
        </header>

        <div className="flex-1 overflow-auto p-5">
          {error && (
            <pre className="mb-3 max-h-32 overflow-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </pre>
          )}
          {!data ? (
            <p className="py-8 text-center text-sm text-slate-500">Yükleniyor…</p>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sipariş ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-800">{data.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Alıcı</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {data.customer?.name ?? data.contactName}{" "}
                    {data.customer?.surname ?? ""}
                  </p>
                  <p className="text-xs text-slate-600">
                    {data.customer?.email ?? data.guestEmail ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Toplam</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {priceFmt(data.totalCents, data.currency)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Kargo: {priceFmt(data.shippingCents, data.currency)} · İndirim:{" "}
                    {priceFmt(data.discountCents, data.currency)}
                  </p>
                  {data.paymentMethod === "BANK_TRANSFER" && data.status === "PENDING" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void (async () => {
                        setBusy(true);
                        try {
                          await adminFetch(`/orders/admin/${orderId}/confirm-bank-payment`, token, {
                            method: "POST",
                          });
                          await load();
                          onUpdated?.();
                        } catch (e) {
                          setError(formatAdminCaughtError(e, "Havale onayı başarısız") ?? "Havale onayı başarısız");
                        } finally {
                          setBusy(false);
                        }
                      })()}
                      className="mt-2 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                      Havale ödemesini onayla
                    </button>
                  ) : null}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-900">Kalemler</h4>
                <ul className="mt-2 space-y-1.5">
                  {data.items.map((it, idx) => (
                    <li
                      key={it.id ?? idx}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-slate-100"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{it.titleSnapshot}</span>
                        {it.variantLabelSnapshot || it.productVariantId ? (
                          <p className="mt-0.5 text-[11px] font-medium text-violet-700">
                            Seçenek: {it.variantLabelSnapshot ?? it.productVariantId ?? "—"}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-slate-500">
                        ×{it.quantity} @ {priceFmt(it.unitPriceCents, data.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Teslimat bilgileri</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs">
                    <span className="font-semibold text-slate-600">Ad Soyad</span>
                    <input
                      className="input-soft mt-1"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-slate-600">Telefon</span>
                    <input
                      className="input-soft mt-1"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </label>
                </div>
                <label className="block text-xs">
                  <span className="font-semibold text-slate-600">Adres 1</span>
                  <input
                    className="input-soft mt-1"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-semibold text-slate-600">Adres 2</span>
                  <input
                    className="input-soft mt-1"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-xs">
                    <span className="font-semibold text-slate-600">İlçe</span>
                    <input
                      className="input-soft mt-1"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-slate-600">Şehir</span>
                    <input
                      className="input-soft mt-1"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-semibold text-slate-600">Posta kodu</span>
                    <input
                      className="input-soft mt-1"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">Kargo</h4>
                <label className="block text-xs">
                  <span className="font-semibold text-slate-600">Kargo firması</span>
                  <select
                    className="input-soft mt-1"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="YURTICI">Yurtiçi Kargo</option>
                    <option value="ARAS">Aras Kargo</option>
                    <option value="MNG">MNG Kargo</option>
                    <option value="SURAT">Sürat Kargo</option>
                    <option value="PTT">PTT Kargo</option>
                    <option value="HEPSIJET">Hepsijet</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="font-semibold text-slate-600">Kargo takip numarası</span>
                  <input
                    className="input-soft mt-1"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Örn. YK1234567890"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-semibold text-slate-600">Notlar</span>
                  <textarea
                    className="input-soft mt-1"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </section>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <span className="text-xs text-slate-500">
            {saved ? "✓ Kaydedildi" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !data}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
