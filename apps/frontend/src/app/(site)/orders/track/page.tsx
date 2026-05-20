import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/site/PageContainer";

export default function OrderTrackEntryPage() {
  return (
    <PageContainer as="main" width="narrow" className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Destek"
        title="Sipariş takibi"
        description="Sipariş takibi artık yalnızca müşteri hesabı üzerinden görüntülenir."
      />
      <div className="si-page-card fade-up mt-8 flex flex-wrap gap-3 p-6 sm:p-8">
        <Link href="/hesap/giris" className="si-btn-primary">
          Giriş yap
        </Link>
        <Link href="/orders" className="si-btn-ghost">
          Siparişlerim
        </Link>
      </div>
    </PageContainer>
  );
}
