import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Gizlilik Politikası" };

export default async function GizlilikPage() {
  const s = await getSiteSettings();
  const iletisim = s.contactEmail || "iletisim@firma.com";
  return (
    <LegalPage kicker="Yasal" title="Gizlilik ve Çerez Politikası" updatedAt="21.04.2026">
      <p>
        Bu politika, {s.siteName} web sitesini ziyaret ettiğinizde hangi bilgilerin toplandığını,
        nasıl kullanıldığını ve haklarınızı açıklar.
      </p>

      <h2>Toplanan Bilgiler</h2>
      <ul>
        <li>Hesap bilgileri: ad, soyad, e-posta, telefon, doğum tarihi</li>
        <li>Sipariş bilgileri: teslimat adresi, fatura bilgileri, satın alma geçmişi</li>
        <li>Teknik bilgiler: IP adresi, tarayıcı bilgisi, çerezler</li>
      </ul>

      <h2>Çerezler</h2>
      <p>
        Web sitemizde oturumu sürdürmek, sepet içeriğini saklamak ve kullanıcı deneyimini iyileştirmek
        için çerezler kullanılır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; bazı çerezleri
        engellemek sitenin düzgün çalışmamasına yol açabilir.
      </p>

      <h2>Bilgilerin Kullanımı</h2>
      <ul>
        <li>Siparişlerin işlenmesi ve teslim edilmesi</li>
        <li>Hesap güvenliği ve dolandırıcılık önleme</li>
        <li>Müşteri hizmetleri ve iletişim</li>
        <li>Onayınız varsa pazarlama iletişimi</li>
      </ul>

      <h2>Üçüncü Taraflar</h2>
      <p>
        Ödeme işlemleri İyzico gibi PCI-DSS uyumlu ödeme sağlayıcıları üzerinden gerçekleştirilir;
        kart bilgilerinizi biz saklamayız.
      </p>

      <h2>Veri Güvenliği</h2>
      <p>
        Verileriniz şifrelenmiş bağlantı (HTTPS) üzerinden iletilir ve hash&apos;lenmiş şifrelerle
        korunur. Yetkisiz erişime karşı idari ve teknik tedbirler alınmaktadır.
      </p>

      <h2>İletişim</h2>
      <p>
        Sorularınız için:{" "}
        <a className="link-underline" href={`mailto:${iletisim}`}>{iletisim}</a>
      </p>
    </LegalPage>
  );
}
