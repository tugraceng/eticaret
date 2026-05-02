-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "surname" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "distanceSalesAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "identityNumber" TEXT,
ADD COLUMN     "kvkkAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT DEFAULT 'TR',
ADD COLUMN     "shippingDistrict" TEXT,
ADD COLUMN     "shippingLine1" TEXT,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "kvkkAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "surname" TEXT;
