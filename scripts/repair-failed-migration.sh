#!/bin/sh
# P3009: 20260511120000_site_header_nav başarısız kaydını düzeltir.
# Repo kökünde: sh scripts/repair-failed-migration.sh

set -e
SCHEMA="database/prisma/schema.prisma"
MIGRATION="20260511120000_site_header_nav"

echo "==> headerNav sütunu (yoksa eklenir)..."
npx prisma db execute --schema="$SCHEMA" --stdin <<'SQL'
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "headerNav" JSONB;
SQL

echo "==> Migration applied olarak işaretleniyor: $MIGRATION"
npx prisma migrate resolve --applied "$MIGRATION" --schema="$SCHEMA"

echo "==> Bekleyen migration'lar..."
npx prisma migrate deploy --schema="$SCHEMA"

echo "==> Bitti. API servisini yeniden başlatın."
