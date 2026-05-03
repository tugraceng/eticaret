import Link from "next/link";

export default function OrderTrackEntryPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="section-shell p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Sipariş takip
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Hesabınıza giriş yapın
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sipariş takibi artık yalnızca müşteri hesabı üzerinden görüntülenir.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/hesap/giris" className="btn-primary">
            Giriş yap
          </Link>
          <Link href="/orders" className="btn-ghost">
            Siparişlerim
          </Link>
        </div>
      </div>
    </main>
  );
}
