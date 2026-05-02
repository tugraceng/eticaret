-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "popupBody" TEXT,
ADD COLUMN     "popupCtaHref" TEXT,
ADD COLUMN     "popupCtaLabel" TEXT,
ADD COLUMN     "popupDismissBackdrop" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "popupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "popupImageUrl" TEXT,
ADD COLUMN     "popupSessionOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "popupSize" TEXT NOT NULL DEFAULT 'md',
ADD COLUMN     "popupStorageKey" TEXT NOT NULL DEFAULT '1',
ADD COLUMN     "popupTitle" TEXT;
