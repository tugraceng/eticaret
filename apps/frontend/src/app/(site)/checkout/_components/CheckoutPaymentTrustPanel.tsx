"use client";

type PaymentProviderId = "MOCK" | "IYZICO" | "PAYTR" | "STRIPE" | "BANK_TRANSFER";

export function CheckoutPaymentTrustPanel({ paymentProvider }: { paymentProvider: PaymentProviderId }) {
  const isIyzico = paymentProvider === "IYZICO";
  const isBank = paymentProvider === "BANK_TRANSFER";
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-950">Güvenli ödeme ortamı</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900/85">
            Bağlantınız HTTPS ile şifrelenir. Kart numarası ve CVV bu mağaza veritabanında{" "}
            <span className="font-medium">saklanmaz</span>; ödeme, yetkili ödeme kuruluşunun sayfasında
            tamamlanır.
          </p>
          {isIyzico ? (
            <p className="mt-2 text-xs font-medium text-emerald-900/90">
              İyzico üzerinden ödeme: bankanız 3D Secure veya ek doğrulama isteyebilir — bu, hesabınızı
              koruyan normal bir adımdır.
            </p>
          ) : null}
          {isBank ? (
            <p className="mt-2 text-xs font-medium text-emerald-900/90">
              Havale/EFT ile ödeme: sipariş onaylandıktan sonra stok düşülür ve hazırlık başlar.
            </p>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3" role="list">
        <li className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-slate-900">Şifreli bağlantı</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              Tarayıcı ile sunucu arasında veri iletimi TLS ile korunur.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-slate-900">Veri minimizasyonu</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              Kart ham verisi bizde tutulmaz; tekrarlayan tahsilat ödeme altyapısı token&apos;ları ile yapılır.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:col-span-1">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
            <path d="M14 2v6h6M10 13h4M10 17h4M8 13h.01M8 17h.01" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-slate-900">Şeffaf sipariş</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              Onay sonrası sipariş numaranız ve özet e-posta ile size iletilir; iade koşulları sözleşmede
              bellidir.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
