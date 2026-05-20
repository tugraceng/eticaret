/** Kişiye özel sipariş bilgilendirme bandı gösterilecek kategori. */
export function isPersonalizedCategory(cat?: { name: string; slug: string } | null): boolean {
  if (!cat) return false;
  const slug = cat.slug.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const name = cat.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return (
    slug.includes("kisiye") ||
    slug.includes("kisisel") ||
    slug.includes("personal") ||
    slug.includes("ozel-urun") ||
    name.includes("kisiye ozel") ||
    name.includes("kisisel")
  );
}

export const PERSONALIZED_ORDER_NOTICE =
  "Kişiye özel ürün siparişlerinizde, sipariş sonrası sipariş numaranız ile birlikte görsel veya yazı detaylarını WhatsApp üzerinden iletmeniz gerekmektedir.";
