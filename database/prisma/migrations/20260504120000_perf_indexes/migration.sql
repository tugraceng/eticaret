-- Perf index migrasyonu.
-- schema.prisma'daki yeni @@index'lerin karşılığı + arama için pg_trgm GIN.

-- ---- Product: listeleme ve katalog filtresi için composite btree ----
CREATE INDEX IF NOT EXISTS "Product_isPublished_updatedAt_idx"
  ON "Product"("isPublished", "updatedAt");
CREATE INDEX IF NOT EXISTS "Product_isPublished_priceCents_idx"
  ON "Product"("isPublished", "priceCents");
CREATE INDEX IF NOT EXISTS "Product_categoryId_isPublished_updatedAt_idx"
  ON "Product"("categoryId", "isPublished", "updatedAt");

-- ---- Review: withRatings groupBy/aggregate için ----
CREATE INDEX IF NOT EXISTS "Review_isApproved_productId_idx"
  ON "Review"("isApproved", "productId");

-- ---- Order: admin listesi + /orders/me + status filtreleri ----
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx"
  ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_buyerUserId_createdAt_idx"
  ON "Order"("buyerUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx"
  ON "Order"("status", "createdAt");

-- ---- BlogPost: published listesinin sıralaması için ----
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx"
  ON "BlogPost"("publishedAt");

-- ---- StockMovement: sipariş iade takibi için ----
CREATE INDEX IF NOT EXISTS "StockMovement_orderId_idx"
  ON "StockMovement"("orderId");

-- ---- pg_trgm: ILIKE %...% aramaları için ----
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"
  ON "Product" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_slug_trgm_idx"
  ON "Product" USING gin ("slug" gin_trgm_ops);

-- description üzerinde de arama yapıldığı için opsiyonel ek (büyüklüğe dikkat):
-- CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx"
--   ON "Product" USING gin ("description" gin_trgm_ops);
