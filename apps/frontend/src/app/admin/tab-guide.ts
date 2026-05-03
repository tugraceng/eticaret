import type { Tab } from "./tabs";

/** Her sekme için tek cümlelik açıklama — sayfanın üstünde gösterilir. */
export const ADMIN_TAB_GUIDE: Record<Tab, { title: string; body: string }> = {
  overview: {
    title: "Bu sayfada ne var?",
    body: "Satış özeti, son siparişler ve vitrin istatistikleri. Aşağıdan sık kullanılan bölümlere gidebilirsiniz.",
  },
  home: {
    title: "Ana sayfa düzeni",
    body: "Ziyaretçilerin ilk gördüğü bölümleri buradan düzenlersiniz: vitrin slaytları, metinler ve blok sırası (JSON ile).",
  },
  settings: {
    title: "Mağaza bilgileri",
    body: "Site adı, logo, renkler ve genel ayarlar. Değişiklikler tüm sitede görünür.",
  },
  categories: {
    title: "Ürün grupları",
    body: "Mağazadaki kategorileri oluşturun veya silin. Ürünler bu gruplara bağlanır.",
  },
  products: {
    title: "Ürünler",
    body: "Yeni ürün ekleyin, listeden düzenleyin: fiyat, stok, görseller ve isteğe bağlı varyantlar (renk, beden vb.).",
  },
  cms: {
    title: "Blog, hizmet ve proje sayfaları",
    body: "Yeni blog, hizmet veya proje ekleyin. Kayıtlı blog yazılarını listeden düzenleyebilir veya silebilirsiniz.",
  },
  orders: {
    title: "Siparişler",
    body: "Sipariş durumunu güncelleyin (hazırlanıyor, kargoda…). Detay için satırdaki bağlantıyı kullanın.",
  },
  customers: {
    title: "Müşteriler",
    body: "Kayıtlı müşteri hesaplarını listeleyin: e-posta, sipariş sayısı ve kampanya izni.",
  },
  discounts: {
    title: "İndirim kodları",
    body: "Müşterilerin sepette kullanacağı kuponları oluşturun; yüzde veya sabit tutar tanımlayabilirsiniz.",
  },
  marketing: {
    title: "Kampanya mesajları",
    body: "İzinli müşterilere e-posta kampanyası oluşturun, alıcı sayısını önizleyin ve terk edilmiş sepet hatırlatması gönderin.",
  },
  payments: {
    title: "Ödeme ayarları",
    body: "iyzico ve ödeme ile ilgili teknik ayarlar. Yanlış değişiklik ödeme almayı durdurabilir; emin değilseniz dokunmayın.",
  },
  reviews: {
    title: "Müşteri yorumları",
    body: "Yayımlanmayı bekleyen yorumları onaylayın veya reddedin.",
  },
  returns: {
    title: "İade talepleri",
    body: "Müşteri iade isteklerini görüntüleyin ve durumlarını güncelleyin.",
  },
  stock: {
    title: "Stok hareketleri",
    body: "Ürün stoklarındaki artış/azalış kayıtlarını izleyin; envanter takibi için kullanılır.",
  },
  shipping: {
    title: "Kargo ücretleri",
    body: "Tutar aralığına göre kargo fiyatını belirleyin (ör. 0–500 TL arası X TL).",
  },
  notifications: {
    title: "Bildirimler",
    body: "Sistem uyarıları ve özetler. Okundu işaretleyerek listeden temizleyebilirsiniz.",
  },
};
