"use client";

import type { SiteSettings } from "@/lib/settings";

const DEFAULT_BULLETS = [
  "Yeni koleksiyonlardan ilk siz haberdar olun",
  "Özenle üretilen yeni parçalar",
  "Sınırlı üretim duyuruları",
];

function parseBullets(raw: string | null | undefined): string[] {
  const lines = (raw ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines : DEFAULT_BULLETS;
}

export function SiteFooterNewsletter({ settings }: { settings?: SiteSettings | null }) {
  const placeholder = settings?.newsletterPlaceholder?.trim() || "E-posta adresiniz";
  const bullets = parseBullets(settings?.newsletterBullets);

  return (
    <div className="si-newsletter-panel w-full max-w-lg">
      <form
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          name="newsletter-email"
          placeholder={placeholder}
          className="si-newsletter-input"
          autoComplete="email"
        />
        <button type="submit" className="si-btn-primary min-h-[3rem] shrink-0 px-6">
          Abone ol
        </button>
      </form>
      <div className="si-newsletter-benefits" aria-hidden>
        {bullets.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  );
}
