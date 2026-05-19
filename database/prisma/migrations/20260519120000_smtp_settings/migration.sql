-- SMTP e-posta ayarları (SiteSettings)
ALTER TABLE "SiteSettings" ADD COLUMN "smtpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpHost" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpPort" INTEGER NOT NULL DEFAULT 587;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpUsername" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpPassword" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpEncryption" TEXT NOT NULL DEFAULT 'tls';
ALTER TABLE "SiteSettings" ADD COLUMN "smtpFromEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "smtpFromName" TEXT;
