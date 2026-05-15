/** Mağaza / müşteri arayüzünde sipariş `status` alanı için Türkçe metinler (API değeri değişmez). */

const LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

export function orderStatusLabelTr(status: string): string {
  return LABELS[status] ?? status;
}

/** Sipariş detay üst başlığı — kısa durum özeti. */
export function orderStatusHeadlineTr(status: string): string {
  switch (status) {
    case "PENDING":
      return "Ödeme bekleniyor";
    case "PAID":
      return "Ödemeniz alındı";
    case "PROCESSING":
      return "Siparişiniz hazırlanıyor";
    case "SHIPPED":
      return "Siparişiniz kargoda";
    case "DELIVERED":
      return "Siparişiniz teslim edildi";
    case "CANCELLED":
      return "Sipariş iptal edildi";
    default:
      return "Sipariş durumu";
  }
}
