-- SiteSettings: üst promosyon şeridi + giriş/kayıt sol paneli
ALTER TABLE "SiteSettings" ADD COLUMN "topPromoLine1" TEXT NOT NULL DEFAULT 'Tüm ürünlerde %3 havale/EFT indirimi';
ALTER TABLE "SiteSettings" ADD COLUMN "topPromoLine2" TEXT NOT NULL DEFAULT '2.000 TL üzeri kargo ücretsiz';
ALTER TABLE "SiteSettings" ADD COLUMN "topPromoLine3" TEXT NOT NULL DEFAULT '9 aya varan taksit imkânı';
ALTER TABLE "SiteSettings" ADD COLUMN "topPromoBgColor" TEXT NOT NULL DEFAULT '#0f172a';
ALTER TABLE "SiteSettings" ADD COLUMN "topPromoTextColor" TEXT NOT NULL DEFAULT '#f8fafc';
ALTER TABLE "SiteSettings" ADD COLUMN "authPanelTitle" TEXT NOT NULL DEFAULT 'Her adımda kalite.';
ALTER TABLE "SiteSettings" ADD COLUMN "authPanelSubtitle" TEXT NOT NULL DEFAULT 'Hassas üretim ve zamansız tasarımı bir araya getiren seçkin ürünler, tek tıkla kapınızda.';
ALTER TABLE "SiteSettings" ADD COLUMN "authPanelImageUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "authPanelGradientFrom" TEXT NOT NULL DEFAULT '#334155';
ALTER TABLE "SiteSettings" ADD COLUMN "authPanelGradientTo" TEXT NOT NULL DEFAULT '#020617';
ALTER TABLE "SiteSettings" ADD COLUMN "authPanelTextColor" TEXT NOT NULL DEFAULT '#ffffff';
