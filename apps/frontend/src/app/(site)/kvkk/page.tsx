import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

export default async function KvkkPage() {
  const s = await getSiteSettings();
  const veriSorumlusu = s.siteName;
  const iletisim = s.contactEmail || "iletisim@firma.com";

  return (
    <LegalPage kicker="Yasal" title="KVKK Aydınlatma Metni" updatedAt="21.04.2026">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, veri sorumlusu
        sıfatıyla <strong>{veriSorumlusu}</strong>, kişisel verilerinizin güvenliğine önem vermektedir.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <p>
        Veri Sorumlusu: <strong>{veriSorumlusu}</strong>
        {s.address ? <> — Adres: {s.address}</> : null}
        <br />
        İletişim: <a className="link-underline" href={`mailto:${iletisim}`}>{iletisim}</a>
      </p>

      <h2>2. İşlenen Kişisel Veriler</h2>
      <ul>
        <li>Kimlik bilgileri: ad, soyad, doğum tarihi, (opsiyonel) T.C. kimlik numarası</li>
        <li>İletişim bilgileri: e-posta, telefon numarası, teslimat ve fatura adresi</li>
        <li>Müşteri işlem bilgileri: sipariş geçmişi, ödeme bilgileri, talep/şikayet kayıtları</li>
        <li>İşlem güvenliği: IP adresi, çerez ve oturum bilgileri</li>
        <li>Pazarlama (onay vermeniz halinde): tercihleri, davranış analizleri</li>
      </ul>

      <h2>3. İşleme Amaçları</h2>
      <ul>
        <li>Sipariş, sözleşme ve satış sonrası süreçlerin yürütülmesi</li>
        <li>Fatura, kargo, ödeme ve iade işlemlerinin gerçekleştirilmesi</li>
        <li>Üyelik kaydı, hesap güvenliği ve müşteri hizmetleri</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi (6502 s. TKHK, VUK, KVKK vb.)</li>
        <li>Açık rıza verdiyseniz, kampanya ve bilgilendirme iletileri</li>
      </ul>

      <h2>4. Aktarım</h2>
      <p>
        Kişisel verileriniz; kargo şirketleri, ödeme kuruluşları (İyzico vb.), e-fatura sağlayıcıları,
        yazılım altyapı sağlayıcıları ve yetkili kamu kurum ve kuruluşları ile sınırlı olarak, KVKK&apos;nın
        8. ve 9. maddelerine uygun şekilde paylaşılabilir.
      </p>

      <h2>5. Toplama Yöntemi ve Hukuki Sebep</h2>
      <p>
        Verileriniz; web sitesi, e-posta, çağrı merkezi, sosyal medya ve fiziki ortam üzerinden; KVKK
        m.5/2 kapsamındaki bir sözleşmenin kurulması/ifası, hukuki yükümlülük, meşru menfaat ve
        pazarlama faaliyetleri için açık rızanız hukuki sebeplerine dayanarak toplanmaktadır.
      </p>

      <h2>6. Haklarınız (KVKK m.11)</h2>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
        <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
        <li>KVKK&apos;nın 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme</li>
        <li>Düzeltme/silme/yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
        <li>Otomatik sistemlerle analiz edilmesi sonucu aleyhinize çıkan sonuca itiraz etme</li>
        <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme</li>
      </ul>

      <p>
        Haklarınızı kullanmak için{" "}
        <a className="link-underline" href={`mailto:${iletisim}`}>
          {iletisim}
        </a>{" "}
        adresine başvurabilirsiniz.
      </p>
    </LegalPage>
  );
}
