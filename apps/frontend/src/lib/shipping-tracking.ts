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

/** Takip numarasından kargo firması tahmini (admin seçmemişse). */
export function inferCarrierFromTracking(trackingNumber: string): ShippingCarrier | null {
  const tn = trackingNumber.trim().toUpperCase();
  if (!tn) return null;
  if (/^HJ\d/i.test(tn) || tn.includes("HEPSIJET")) return "HEPSIJET";
  if (/^\d{13}$/.test(tn)) return "PTT";
  if (/^MNG/i.test(tn)) return "MNG";
  if (/^ARAS/i.test(tn)) return "ARAS";
  if (/^\d{12}$/.test(tn)) return "YURTICI";
  return null;
}

function resolveCarrier(
  carrier: ShippingCarrier | string | null | undefined,
  trackingNumber: string,
): ShippingCarrier {
  const raw = (carrier ?? "").trim().toUpperCase();
  if (raw && raw !== "OTHER" && raw in CARRIER_LABELS) return raw as ShippingCarrier;
  return inferCarrierFromTracking(trackingNumber) ?? "YURTICI";
}

/** Kargo firması takip sayfası URL'si — takip numarası otomatik eklenir. */
export function carrierTrackingUrl(
  carrier: ShippingCarrier | string | null | undefined,
  trackingNumber: string,
): string | null {
  const tn = trackingNumber.trim();
  if (!tn) return null;
  const c = resolveCarrier(carrier, tn);
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
      return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(tn)}`;
  }
}

/** Etiket + URL birlikte (UI için). */
export function carrierTrackingLink(
  carrier: ShippingCarrier | string | null | undefined,
  trackingNumber: string,
): { url: string; label: string } | null {
  const tn = trackingNumber.trim();
  if (!tn) return null;
  const c = resolveCarrier(carrier, tn);
  const url = carrierTrackingUrl(carrier, tn);
  if (!url) return null;
  return { url, label: CARRIER_LABELS[c] ?? "Kargo" };
}
