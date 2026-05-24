-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "newsletterKicker" TEXT NOT NULL DEFAULT 'Bülten';
ALTER TABLE "SiteSettings" ADD COLUMN "newsletterHeading" TEXT NOT NULL DEFAULT 'Koleksiyonlardan ilk siz haberdar olun';
ALTER TABLE "SiteSettings" ADD COLUMN "newsletterSubtitle" TEXT NOT NULL DEFAULT 'Yeni parçalar ve sınırlı üretimler — doğrudan atölyeden, spam yok.';
ALTER TABLE "SiteSettings" ADD COLUMN "newsletterBullets" TEXT NOT NULL DEFAULT E'Yeni koleksiyonlardan ilk siz haberdar olun\nÖzenle üretilen yeni parçalar\nSınırlı üretim duyuruları';
ALTER TABLE "SiteSettings" ADD COLUMN "newsletterDisclaimer" TEXT NOT NULL DEFAULT 'Abone olarak gizlilik politikasını kabul etmiş olursunuz. İstediğiniz zaman ayrılabilirsiniz.';
ALTER TABLE "SiteSettings" ADD COLUMN "newsletterPlaceholder" TEXT NOT NULL DEFAULT 'E-posta adresiniz';
