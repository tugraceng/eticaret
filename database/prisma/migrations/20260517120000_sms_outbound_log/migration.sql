-- NetGSM / SMS gönderim günlüğü (test, kargo, kampanya)
CREATE TABLE "SmsOutboundLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "toMasked" TEXT NOT NULL,
    "messagePreview" TEXT NOT NULL,
    "filterUsed" TEXT NOT NULL DEFAULT '0',
    "ok" BOOLEAN NOT NULL,
    "providerCode" TEXT,
    "providerDetail" TEXT,
    "orderId" TEXT,
    "campaignId" TEXT,

    CONSTRAINT "SmsOutboundLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SmsOutboundLog_createdAt_idx" ON "SmsOutboundLog"("createdAt");
CREATE INDEX "SmsOutboundLog_purpose_idx" ON "SmsOutboundLog"("purpose");
CREATE INDEX "SmsOutboundLog_orderId_idx" ON "SmsOutboundLog"("orderId");
CREATE INDEX "SmsOutboundLog_campaignId_idx" ON "SmsOutboundLog"("campaignId");
