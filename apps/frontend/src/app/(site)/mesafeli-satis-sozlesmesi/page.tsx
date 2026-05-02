import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Mesafeli Satış Sözleşmesi" };

export default async function MssPage() {
  const s = await getSiteSettings();
  const satici = s.siteName;
  const iletisim = s.contactEmail || "iletisim@firma.com";

  return (
    <LegalPage kicker="Yasal" title="Mesafeli Satış Sözleşmesi" updatedAt="21.04.2026">
      <p>
        İşbu sözleşme; 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
        Yönetmeliği hükümlerine uygun olarak düzenlenmiştir.
      </p>

      <h2>1. Taraflar</h2>
      <p>
        <strong>Satıcı:</strong> {satici}
        {s.address ? <> — {s.address}</> : null}
        {" — "}
        <a className="link-underline" href={`mailto:${iletisim}`}>{iletisim}</a>
        <br />
        <strong>Alıcı:</strong> Sipariş formunda bilgileri belirtilen tüketici.
      </p>

      <h2>2. Sözleşmenin Konusu</h2>
      <p>
        Alıcı&apos;nın satıcıya ait web sitesi üzerinden elektronik ortamda sipariş verdiği,
        nitelikleri ve satış bedeli sipariş özetinde belirtilen ürün(ler)in satışı ve teslimine ilişkin
        tarafların hak ve yükümlülüklerini düzenler.
      </p>

      <h2>3. Ürün Bilgileri ve Bedel</h2>
      <p>
        Ürünlerin türü, miktarı, birim fiyatı, teslimat ve ödeme bilgileri sipariş özetinde belirtilmiştir.
        Fiyatlara KDV dahildir. Kargo ücreti sipariş sırasında ayrıca gösterilir.
      </p>

      <h2>4. Teslimat</h2>
      <ul>
        <li>Teslimat; Alıcı&apos;nın sipariş sırasında bildirdiği adrese, anlaşmalı kargo firması ile yapılır.</li>
        <li>Sipariş onayından sonra en geç 30 gün içinde teslimat gerçekleştirilir.</li>
        <li>Teslimat süresi, stok durumu ve kargo firmasının süreleri ile sınırlıdır.</li>
      </ul>

      <h2>5. Cayma Hakkı</h2>
      <p>
        Alıcı, teslimat tarihinden itibaren <strong>14 (on dört) gün</strong> içinde hiçbir gerekçe
        göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi{" "}
        <a className="link-underline" href={`mailto:${iletisim}`}>{iletisim}</a> adresine yapılmalı ve
        ürün, orijinal ambalajıyla ve fatura ile birlikte iade edilmelidir.
      </p>

      <h3>Cayma Hakkının Kullanılamayacağı Haller (Yönetmelik m.15)</h3>
      <ul>
        <li>Kişiselleştirilmiş, ısmarlama üretilen ürünler</li>
        <li>Hızla bozulabilen/son kullanma tarihi geçebilecek ürünler</li>
        <li>Ambalajı açılmış hijyenik ürünler, kozmetik, iç giyim</li>
        <li>Dijital içerikler (indirme/kullanım başladıktan sonra)</li>
      </ul>

      <h2>6. Genel Hükümler</h2>
      <ul>
        <li>Alıcı, ürünün tüm özelliklerini sipariş öncesi incelediğini beyan eder.</li>
        <li>Alıcı, ön bilgilendirme formunu ve bu sözleşmeyi onayladığını kabul eder.</li>
        <li>Uyuşmazlık halinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</li>
      </ul>

      <p>
        Sipariş formunda &quot;Mesafeli Satış Sözleşmesini okudum ve kabul ediyorum&quot; kutucuğunun
        işaretlenmesi ile işbu sözleşme elektronik ortamda kurulmuş sayılır.
      </p>
    </LegalPage>
  );
}
