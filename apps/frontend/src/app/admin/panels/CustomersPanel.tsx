"use client";

import { AdminCard } from "../ui";

/** Müşteri sekmesi henüz `tabs` listesinde yok; ileride API ile birlikte bağlanabilir. */
export function CustomersPanel() {
  return (
    <AdminCard
      title="Müşteriler"
      description="Kayıtlı müşteri listesi ve detayları bu ekranda toplanacak."
    >
      <p className="text-sm text-slate-600">
        Şimdilik siparişler ve özet ekranındaki CRM satırlarından müşteri bilgisine ulaşabilirsiniz. Bu bölüm,
        müşteri API&apos;si hazır olduğunda etkinleştirilecek.
      </p>
    </AdminCard>
  );
}
