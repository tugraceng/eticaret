export type ShippingCarrier =
  | "YURTICI"
  | "ARAS"
  | "MNG"
  | "SURAT"
  | "PTT"
  | "HEPSIJET"
  | "OTHER";

export const CARRIER_LABELS: Record<ShippingCarrier, string> = {
  YURTICI: "Yurtiçi Kargo",
  ARAS: "Aras Kargo",
  MNG: "MNG Kargo",
  SURAT: "Sürat Kargo",
  PTT: "PTT Kargo",
  HEPSIJET: "Hepsijet",
  OTHER: "Diğer",
};

/** Kargo firması takip sayfası URL'si — takip numarası otomatik eklenir. */
export function carrierTrackingUrl(carrier: ShippingCarrier | string | null | undefined, trackingNumber: string): string | null {
  const tn = trackingNumber.trim();
  if (!tn) return null;
  const c = (carrier ?? "OTHER") as ShippingCarrier;
  switch (c) {
    case "YURTICI":
      return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(tn)}`;
    case "ARAS":
      return `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${encodeURIComponent(tn)}`;
    case "MNG":
      return `https://service.mngkargo.com.tr/iactive/popup/KargoTakipV2.aspx?k=${encodeURIComponent(tn)}`;
    case "SURAT":
      return `https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(tn)}`;
    case "PTT":
      return `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${encodeURIComponent(tn)}`;
    case "HEPSIJET":
      return `https://www.hepsijet.com/gonderi-takibi/${encodeURIComponent(tn)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${tn} kargo takip`)}`;
  }
}
