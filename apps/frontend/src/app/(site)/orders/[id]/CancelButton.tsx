"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { apiUrl } from "@/lib/api";
import { CUSTOMER_TOKEN_KEY } from "@/lib/platform-session";
import { showSiteToast } from "@/lib/site-toast";

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [canShow, setCanShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setCanShow(Boolean(sessionStorage.getItem(CUSTOMER_TOKEN_KEY)));
  }, []);

  if (!canShow) return null;

  const doCancel = async () => {
    setBusy(true);
    setErr(null);
    try {
      const token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
      const res = await fetch(apiUrl(`/orders/${orderId}/cancel`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmOpen(false);
      showSiteToast({ message: "Sipariş iptal edildi.", kind: "success" });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
      >
        {busy ? "İptal ediliyor…" : "Siparişi iptal et"}
      </button>
      {err && <p className="mt-2 w-full text-xs text-rose-700">{err}</p>}
      <ConfirmDialog
        open={confirmOpen}
        title="Siparişi iptal et"
        description="Bu sipariş iptal edilecek ve stok (varsa) iade edilir. Emin misiniz?"
        confirmLabel="Evet, iptal et"
        cancelLabel="Vazgeç"
        variant="danger"
        busy={busy}
        onCancel={() => !busy && setConfirmOpen(false)}
        onConfirm={doCancel}
      />
    </>
  );
}
