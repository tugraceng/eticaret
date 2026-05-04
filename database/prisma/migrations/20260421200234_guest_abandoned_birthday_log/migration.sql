-- Misafir terk edilmiş sepet (checkout e-postası)
CREATE TABLE "GuestAbandonedCart" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "snapshot" JSONB NOT NULL DEFAULT '[]',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestAbandonedCart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestAbandonedCart_email_key" ON "GuestAbandonedCart"("email");
CREATE INDEX "GuestAbandonedCart_lastActivityAt_idx" ON "GuestAbandonedCart"("lastActivityAt");

-- Doğum günü kuponu gönderim günlüğü
CREATE TABLE "BirthdayCouponLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayCouponLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BirthdayCouponLog_userId_year_key" ON "BirthdayCouponLog"("userId", "year");
CREATE INDEX "BirthdayCouponLog_year_idx" ON "BirthdayCouponLog"("year");

ALTER TABLE "BirthdayCouponLog" ADD CONSTRAINT "BirthdayCouponLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
