-- Ürün kartı / mağaza linki tıklama sayacı (admin raporu)
ALTER TABLE "Product" ADD COLUMN "linkClickCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Product_linkClickCount_idx" ON "Product"("linkClickCount");
