"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/** Full-width conversion strip (mobile-first). */
export function HomePromoBanner() {
  return (
    <section
      className="relative isolate overflow-hidden border-y border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-10 text-white"
      aria-labelledby="home-promo-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(56,189,248,0.12),transparent_45%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:max-w-7xl">
        <div className="max-w-xl space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/90">
            Bugün kargoda
          </p>
          <h2 id="home-promo-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
            Hızlı teslimat, güvenli ödeme — sepetinizi bir adımda tamamlayın.
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Öne çıkan ürünleri keşfedin; sınırlı stok uyarıları ve ücretsiz kargo hedefiniz sepetinizde
            görünür.
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full shrink-0 sm:w-auto"
        >
          <Link
            href="/shop"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-sky-50 sm:w-auto"
          >
            Kampanyalı ürünlere git
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
