import Link from "next/link";

type SearchParams = {
  orderId?: string;
  status?: string;
  reason?: string;
};

export default async function IyzicoReturnPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { orderId, status, reason } = await searchParams;
  const ok = status === "success";

  return (
    <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <div
        className={`card-soft p-8 text-center ${
          ok ? "ring-2 ring-emerald-300" : "ring-2 ring-rose-300"
        }`}
      >
        <div
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${
            ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
          aria-hidden
        >
          {ok ? "✓" : "!"}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
          {ok ? "Ödemeniz alındı" : "Ödeme tamamlanamadı"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {ok
            ? "Siparişiniz İyzico üzerinden onaylandı. Aşağıdan detayını görebilirsiniz."
            : reason
              ? `Sebep: ${reason}`
              : "Ödeme reddedildi veya iptal edildi. Lütfen tekrar deneyin."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {orderId && (
            <Link href={`/orders/${orderId}`} className="btn-primary">
              Sipariş detayına git →
            </Link>
          )}
          {!ok && (
            <Link href="/checkout" className="btn-ghost">
              Ödemeyi tekrar dene
            </Link>
          )}
          <Link href="/" className="btn-ghost">
            Alışverişe devam et
          </Link>
        </div>
      </div>
    </main>
  );
}
