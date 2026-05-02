-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "whatsappAccessToken" TEXT,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappGreeting" TEXT,
ADD COLUMN     "whatsappNumber" TEXT,
ADD COLUMN     "whatsappPhoneId" TEXT,
ADD COLUMN     "whatsappShippedTemplate" TEXT,
ADD COLUMN     "whatsappTemplateLang" TEXT NOT NULL DEFAULT 'tr';
