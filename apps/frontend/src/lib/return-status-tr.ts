const LABELS: Record<string, string> = {
  PENDING: "İade Talebi Oluşturuldu",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  COMPLETED: "İade Tamamlandı",
};

export function returnStatusLabelTr(status: string): string {
  if (status === "PENDING") return "İnceleniyor";
  return LABELS[status] ?? status;
}

export function returnStatusHeadlineTr(status: string): string {
  return LABELS[status] ?? returnStatusLabelTr(status);
}
