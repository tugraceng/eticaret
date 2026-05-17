-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "productImageId" TEXT;

-- CreateIndex
CREATE INDEX "ProductVariant_productImageId_idx" ON "ProductVariant"("productImageId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productImageId_fkey" FOREIGN KEY ("productImageId") REFERENCES "ProductImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
