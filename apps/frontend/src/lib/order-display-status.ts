import { orderStatusLabelTr } from "@/lib/order-status-tr";

export type OrderReturnSnippet = { status: string };

/** Sipariş listesi / kart — iade talebine göre gösterilecek durum metni */
export function orderListStatusLabel(
  status: string,
  returns?: OrderReturnSnippet[] | null,
): string {
  const rs = returns ?? [];
  if (rs.some((r) => r.status === "COMPLETED")) return "İade edildi";
  if (rs.some((r) => r.status === "APPROVED")) return "İade onaylandı";
  if (rs.some((r) => r.status === "PENDING")) return "İade inceleniyor";
  if (rs.some((r) => r.status === "REJECTED") && !rs.some((r) => ["PENDING", "APPROVED", "COMPLETED"].includes(r.status))) {
    return "İade reddedildi";
  }
  return orderStatusLabelTr(status);
}

export function orderListStatusBadgeClass(
  status: string,
  returns?: OrderReturnSnippet[] | null,
): string {
  const rs = returns ?? [];
  if (rs.some((r) => r.status === "COMPLETED")) return "si-order-badge si-order-badge-returned";
  if (rs.some((r) => r.status === "APPROVED")) return "si-order-badge si-order-badge-return-approved";
  if (rs.some((r) => r.status === "PENDING")) return "si-order-badge si-order-badge-return-pending";
  const map: Record<string, string> = {
    PENDING: "si-order-badge si-order-badge-pending",
    PAID: "si-order-badge si-order-badge-paid",
    PROCESSING: "si-order-badge si-order-badge-processing",
    SHIPPED: "si-order-badge si-order-badge-shipped",
    DELIVERED: "si-order-badge si-order-badge-delivered",
    CANCELLED: "si-order-badge si-order-badge-cancelled",
  };
  return map[status] ?? "si-order-badge";
}
