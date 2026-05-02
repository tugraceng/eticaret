import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Teslimat ve İade Koşulları" };

export default async function TeslimatIadePage() {
  const s = await getSiteSettings();
  const iletisim = s.contactEmail || "iletisim@firma.com";
  return (
    <LegalPage kicker="Yasal" title="Teslimat ve İade Koşulları" updatedAt="21.04.2026">
      <h2>Teslimat</h2>
      <ul>
        <li>Stoklu ürünler, sipariş onayından sonra 1-3 iş günü içinde kargoya verilir.</li>
        <li>Kargo süresi bölgeye göre 1-4 iş günü arasında değişir.</li>
        <li>Kargo ücreti siparişte hesaplanır; belirli tutar üzeri siparişlerde ücretsiz olabilir.</li>
        <li>Teslim alırken pakette hasar varsa tutanak tutturmanızı rica ederiz.</li>
      </ul>

      <h2>Cayma Hakkı ve İade</h2>
      <ul>
        <li>Teslim tarihinden itibaren 14 gün içinde cayma hakkınız vardır.</li>
        <li>İade edilecek ürün kullanılmamış, orijinal ambalajında ve faturası ile birlikte olmalıdır.</li>
        <li>
          İade başlatmak için{" "}
          <a className="link-underline" href={`mailto:${iletisim}`}>{iletisim}</a> adresine sipariş
          numaranızla birlikte yazabilirsiniz.
        </li>
        <li>
          Kabul edilen iadelerde ödeme, kargonun tarafımıza ulaşıp kontrolünün tamamlanmasından itibaren
          10 iş günü içinde aynı yöntemle yapılır.
        </li>
      </ul>

      <h2>Değişim</h2>
      <p>
        Beden/model değişimlerinde aynı ürünün başka bir varyantı mevcutsa kargo farkı karşılanmadan
        değişim yapılabilir. Varyant mevcut değilse iade prosedürü uygulanır.
      </p>

      <h2>Kargo Hasarı ve Eksik Ürün</h2>
      <p>
        Kargo teslimatı sırasında hasarlı/eksik ürün fark ederseniz kargoyu teslim almayın veya tutanak
        tutturun. Fotoğrafları ile birlikte 48 saat içinde bize bildirmenizi rica ederiz.
      </p>
    </LegalPage>
  );
}
