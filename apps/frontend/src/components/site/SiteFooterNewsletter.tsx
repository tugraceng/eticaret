"use client";

export function SiteFooterNewsletter() {
  return (
    <div className="si-newsletter-panel w-full max-w-lg">
      <form
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          name="newsletter-email"
          placeholder="E-posta adresiniz"
          className="si-newsletter-input"
          autoComplete="email"
        />
        <button type="submit" className="si-btn-primary min-h-[3rem] shrink-0 px-6">
          Abone ol
        </button>
      </form>
      <div className="si-newsletter-benefits" aria-hidden>
        <span>Yeni koleksiyonlardan ilk siz haberdar olun</span>
        <span>Özenle üretilen yeni parçalar</span>
        <span>Sınırlı üretim duyuruları</span>
      </div>
    </div>
  );
}
