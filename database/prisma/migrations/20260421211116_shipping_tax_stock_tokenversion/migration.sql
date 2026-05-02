-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lowStockThreshold" INTEGER;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "taxIncluded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "taxRateBp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'TR',
    "city" TEXT,
    "feeCents" INTEGER NOT NULL,
    "freeThresholdCents" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingRate_country_city_idx" ON "ShippingRate"("country", "city");
