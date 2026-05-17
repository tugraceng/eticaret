-- NetGSM SMS alanları (SiteSettings)
ALTER TABLE "SiteSettings" ADD COLUMN "netgsmEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "netgsmUsercode" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "netgsmPassword" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "netgsmMsgHeader" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "netgsmSmsFilter" TEXT NOT NULL DEFAULT '0';
ALTER TABLE "SiteSettings" ADD COLUMN "netgsmShippedMessageTemplate" TEXT;
