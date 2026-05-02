import type { ComponentType } from "react";
import { Icon } from "../ui";
import type { Tab } from "../tabs";

export type AdminNavItem = {
  id: Tab;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
};

export type AdminNavGroup = { title: string; subtitle?: string; items: readonly AdminNavItem[] };

/** Sidebar / komut paleti için tek kaynak menü yapısı */
export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    title: "Özet ve mağaza",
    subtitle: "Sayfa başı istatistikler ve genel ayarlar",
    items: [
      {
        id: "overview",
        label: "Özet ekranı",
        hint: "Ciro, son siparişler, grafikler ve hızlı kısayollar",
        icon: Icon.Dashboard,
      },
      {
        id: "settings",
        label: "Mağaza bilgileri",
        hint: "Site adı, logo, renkler, iletişim ve teknik ayarlar",
        icon: Icon.Settings,
      },
      {
        id: "notifications",
        label: "Bildirimler",
        hint: "Sistem uyarıları — okundu işaretleyebilirsiniz",
        icon: Icon.Bell,
      },
    ],
  },
  {
    title: "Ürün ve stok",
    subtitle: "Satılacak ürünleri ve grupları yönetin",
    items: [
      {
        id: "categories",
        label: "Kategoriler",
        hint: "Ürün grupları (ör. anahtarlık, dekor). Önce kategori, sonra ürün ekleyin",
        icon: Icon.Folder,
      },
      {
        id: "products",
        label: "Ürünler",
        hint: "Yeni ürün, fiyat, stok, fotoğraf ve varyantlar",
        icon: Icon.Box,
      },
      {
        id: "stock",
        label: "Stok geçmişi",
        hint: "Stok artış/azalış kayıtları — envanter kontrolü",
        icon: Icon.Layers,
      },
    ],
  },
  {
    title: "Sayfa içerikleri",
    subtitle: "Müşterinin gördüğü metin ve düzen",
    items: [
      {
        id: "home",
        label: "Ana sayfa vitrini",
        hint: "Slaytlar ve blok sırası — sitenin ilk ekranı",
        icon: Icon.Home,
      },
      {
        id: "cms",
        label: "Blog ve ek sayfalar",
        hint: "Blog yazısı, hizmet sayfası, proje portföyü",
        icon: Icon.Doc,
      },
    ],
  },
  {
    title: "Sipariş ve müşteri",
    subtitle: "Sipariş akışı ve geri bildirim",
    items: [
      {
        id: "orders",
        label: "Siparişler",
        hint: "Durum güncelleme, kalem listesi, detay",
        icon: Icon.Bag,
      },
      {
        id: "returns",
        label: "İade talepleri",
        hint: "Müşteri iade isteklerini işleyin",
        icon: Icon.Undo,
      },
      {
        id: "reviews",
        label: "Yorumlar",
        hint: "Ürün yorumlarını onaylayın veya reddedin",
        icon: Icon.Eye,
      },
    ],
  },
  {
    title: "Ödeme ve kargo",
    subtitle: "Fiyat kuralları ve teslimat",
    items: [
      {
        id: "discounts",
        label: "İndirim kodları",
        hint: "Kupon oluşturma — yüzde veya sabit indirim",
        icon: Icon.Tag,
      },
      {
        id: "payments",
        label: "Ödeme (iyzico)",
        hint: "Ödeme entegrasyonu — dikkatli kullanın",
        icon: Icon.Card,
      },
      {
        id: "shipping",
        label: "Kargo fiyatları",
        hint: "Sepet tutarına göre kargo ücreti tablosu",
        icon: Icon.Truck,
      },
    ],
  },
];

export function flattenAdminNav(items: readonly AdminNavGroup[]): AdminNavItem[] {
  return items.flatMap((g) => [...g.items]);
}
