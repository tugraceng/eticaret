-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ShippingCarrier" AS ENUM ('YURTICI', 'ARAS', 'MNG', 'SURAT', 'PTT', 'HEPSIJET', 'OTHER');

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'BANK_TRANSFER';

-- AlterTable SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "bankTransferInstructions" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "returnWindowDays" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "SiteSettings" ADD COLUMN "homeCraftKicker" TEXT NOT NULL DEFAULT 'Üretim kalitesi';
ALTER TABLE "SiteSettings" ADD COLUMN "homeCraftTitle" TEXT NOT NULL DEFAULT 'Dijital zanaat';
ALTER TABLE "SiteSettings" ADD COLUMN "homeCraftBody" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "homeCraftImageUrl" TEXT;

-- CreateTable BankAccount
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "branch" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BankAccount_isActive_sortOrder_idx" ON "BankAccount"("isActive", "sortOrder");

-- CreateTable CheckoutDraft
CREATE TABLE "CheckoutDraft" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutDraft_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CheckoutDraft_orderId_key" ON "CheckoutDraft"("orderId");
CREATE INDEX "CheckoutDraft_status_expiresAt_idx" ON "CheckoutDraft"("status", "expiresAt");

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "brand" TEXT;
ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "featuredSortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "Product_isPublished_sortOrder_idx" ON "Product"("isPublished", "sortOrder");
CREATE INDEX "Product_isFeatured_featuredSortOrder_idx" ON "Product"("isFeatured", "featuredSortOrder");

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "OrderPaymentMethod" NOT NULL DEFAULT 'CARD';
ALTER TABLE "Order" ADD COLUMN "carrier" "ShippingCarrier";
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "bankPaymentConfirmedAt" TIMESTAMP(3);

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN "checkoutDraftId" TEXT;
CREATE INDEX "Payment_checkoutDraftId_idx" ON "Payment"("checkoutDraftId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_checkoutDraftId_fkey" FOREIGN KEY ("checkoutDraftId") REFERENCES "CheckoutDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
