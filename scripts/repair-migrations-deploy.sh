#!/bin/sh
# Veritabanı şeması migration dosyalarından ilerideyken (sütun/tablo zaten var) P3009/P3018 düzeltir.
# Repo kökünde: sh scripts/repair-migrations-deploy.sh

set -e
SCHEMA="database/prisma/schema.prisma"

apply_sql() {
  npx prisma db execute --schema="$SCHEMA" --stdin <<SQL
$1
SQL
}

mark_applied() {
  echo "==> resolve --applied $1"
  npx prisma migrate resolve --applied "$1" --schema="$SCHEMA" 2>/dev/null || true
}

echo "==> Idempotent şema düzeltmeleri (eksik olanlar eklenir)..."

apply_sql 'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "headerNav" JSONB;'
mark_applied "20260511120000_site_header_nav"

apply_sql '
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "productImageId" TEXT;
CREATE INDEX IF NOT EXISTS "ProductVariant_productImageId_idx" ON "ProductVariant"("productImageId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ''ProductVariant_productImageId_fkey'') THEN
    ALTER TABLE "ProductVariant"
      ADD CONSTRAINT "ProductVariant_productImageId_fkey"
      FOREIGN KEY ("productImageId") REFERENCES "ProductImage"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
'
mark_applied "20260515143000_variant_gallery_image"

apply_sql '
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netgsmEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netgsmUsercode" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netgsmPassword" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netgsmMsgHeader" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netgsmSmsFilter" TEXT NOT NULL DEFAULT ''0'';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netgsmShippedMessageTemplate" TEXT;
'
mark_applied "20260517103000_netgsm_sms_settings"

apply_sql '
CREATE TABLE IF NOT EXISTS "SmsOutboundLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "toMasked" TEXT NOT NULL,
    "messagePreview" TEXT NOT NULL,
    "filterUsed" TEXT NOT NULL DEFAULT ''0'',
    "ok" BOOLEAN NOT NULL,
    "providerCode" TEXT,
    "providerDetail" TEXT,
    "orderId" TEXT,
    "campaignId" TEXT,
    CONSTRAINT "SmsOutboundLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SmsOutboundLog_createdAt_idx" ON "SmsOutboundLog"("createdAt");
CREATE INDEX IF NOT EXISTS "SmsOutboundLog_purpose_idx" ON "SmsOutboundLog"("purpose");
CREATE INDEX IF NOT EXISTS "SmsOutboundLog_orderId_idx" ON "SmsOutboundLog"("orderId");
CREATE INDEX IF NOT EXISTS "SmsOutboundLog_campaignId_idx" ON "SmsOutboundLog"("campaignId");
'
mark_applied "20260517120000_sms_outbound_log"

apply_sql '
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpHost" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpPort" INTEGER NOT NULL DEFAULT 587;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpUsername" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpPassword" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpEncryption" TEXT NOT NULL DEFAULT ''tls'';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpFromEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smtpFromName" TEXT;
'
mark_applied "20260519120000_smtp_settings"

echo "==> prisma migrate deploy"
ATTEMPTS=0
while [ "$ATTEMPTS" -lt 5 ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if npx prisma migrate deploy --schema="$SCHEMA"; then
    echo "==> Tüm migration'lar uygulandı. API servisini yeniden başlatın."
    exit 0
  fi
  echo "==> Deploy başarısız (deneme $ATTEMPTS). migrate status:"
  npx prisma migrate status --schema="$SCHEMA" || true
  echo ""
  echo "Başarısız migration adını yukarıdan kopyalayıp:"
  echo "  npx prisma migrate resolve --applied <ad> --schema=$SCHEMA"
  echo "ardından bu scripti tekrar çalıştırın."
  exit 1
done
