"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

const FEATURE_BLOCKS = [
  {
    t: "Hızlı hazırlık",
    d: "Siparişiniz 24-48 saat içinde fatura ve paketleme aşamalarına alınır; kargo aşamasında bilgilendirme yapılır.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="1" y="4" width="13" height="9" rx="1" />
        <path d="M14 7.5h2.5L19 8.5V12H14V7.5z" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
  },
  {
    t: "Güvenli ödeme",
    d: "SSL ile şifreli ödeme, havale/EFT ve kart seçenekleri. Faturanız e-posta ile ulaşır.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    t: "Destek",
    d: "Teslimat, iade veya ürünle ilgili tüm sorularınızda iletişim formu ve müşteri hizmetlerimiz yanınızda.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
] as const;

type TabId = "description" | "features" | "shipping";

const TAB_ITEMS: Array<{ id: TabId; label: string }> = [
  { id: "description", label: "Açıklama" },
  { id: "features", label: "Özellikler" },
  { id: "shipping", label: "Kargo ve iade" },
];

const TAB_ORDER = TAB_ITEMS.map((t) => t.id);

export function ProductDetailTabs({ description }: { description: string | null }) {
  const [active, setActive] = useState<TabId>("description");

  const focusTab = (id: TabId) => {
    window.requestAnimationFrame(() => document.getElementById(`product-tab-${id}`)?.focus());
  };

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, tabId: TabId) => {
    const i = TAB_ORDER.indexOf(tabId);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = TAB_ORDER[(i + 1) % TAB_ORDER.length]!;
      setActive(next);
      focusTab(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = TAB_ORDER[(i - 1 + TAB_ORDER.length) % TAB_ORDER.length]!;
      setActive(next);
      focusTab(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      const next = TAB_ORDER[0]!;
      setActive(next);
      focusTab(next);
    } else if (e.key === "End") {
      e.preventDefault();
      const next = TAB_ORDER[TAB_ORDER.length - 1]!;
      setActive(next);
      focusTab(next);
    }
  };

  return (
    <section
      className="mt-12 scroll-mt-24 border-t border-slate-200/90 pt-10"
      aria-labelledby="product-detail-tabs-heading"
    >
      <h2 id="product-detail-tabs-heading" className="sr-only">
        Ürün bilgileri
      </h2>

      <div className="relative -mx-4 sm:mx-0">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-slate-50 to-transparent sm:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-slate-50 to-transparent sm:hidden"
          aria-hidden
        />
        <div
          role="tablist"
          aria-label="Ürün sekmeleri"
          className={cn(
            "flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 pt-0.5 [scrollbar-width:none] sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 [&::-webkit-scrollbar]:hidden",
            "snap-x snap-mandatory scroll-px-4 sm:snap-none",
          )}
        >
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={`product-tab-panel-${tab.id}`}
              id={`product-tab-${tab.id}`}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onTabKeyDown(e, tab.id)}
              tabIndex={active === tab.id ? 0 : -1}
              className={cn(
                "min-h-11 shrink-0 snap-start rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                active === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div
          id="product-tab-panel-description"
          role="tabpanel"
          aria-labelledby="product-tab-description"
          hidden={active !== "description"}
        >
          {description?.trim() ? (
            <p className="text-sm leading-relaxed text-slate-700 [text-wrap:pretty] whitespace-pre-wrap">
              {description.trim()}
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Bu ürün için henüz detaylı açıklama eklenmemiş.
            </p>
          )}
        </div>

        <div
          id="product-tab-panel-features"
          role="tabpanel"
          aria-labelledby="product-tab-features"
          hidden={active !== "features"}
        >
          <p className="mb-4 text-sm text-slate-600">
            Seçkin malzemeler ve sade tasarım; günlük kullanımda konfor ve güven.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURE_BLOCKS.map((block) => (
              <div
                key={block.t}
                className="flex flex-col rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 text-left sm:bg-white"
              >
                <div className="text-slate-500">{block.icon}</div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{block.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          id="product-tab-panel-shipping"
          role="tabpanel"
          aria-labelledby="product-tab-shipping"
          hidden={active !== "shipping"}
        >
          <ul className="flex flex-col gap-4 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M3 9l9-5 9 5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
                  <path d="M9 11V3M15 11V3" />
                </svg>
              </span>
              <span>
                2.000 TL ve üzeri alışverişlerde{" "}
                <strong className="font-semibold text-slate-900">kargo</strong> koşullarımız geçerlidir. Detaylar için{" "}
                <Link href="/teslimat-iade" className="font-semibold text-sky-800 underline hover:text-sky-950">
                  teslimat ve iade
                </Link>{" "}
                sayfamıza bakın.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M12 2l1.8 3.2h3.6L16.6 7.8l1.1 3.1L12 8.4 6.3 10.9l1.1-3.1L6.6 5.2h3.6L12 2z" />
                </svg>
              </span>
              <span>
                İade ve tüketici haklarınız <strong className="font-semibold text-slate-900">güvence</strong> altındadır.
                Mesafeli satış ve cayma koşulları için yine{" "}
                <Link href="/teslimat-iade" className="font-semibold text-sky-800 underline hover:text-sky-950">
                  ilgili sayfayı
                </Link>{" "}
                inceleyebilirsiniz.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
