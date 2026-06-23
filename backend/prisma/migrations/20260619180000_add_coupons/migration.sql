-- Coupons: tenant-scoped discount codes, optionally tied to a customer.
CREATE TABLE "coupons" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'percent',
  "value" DECIMAL(10,2) NOT NULL,
  "minOrder" DECIMAL(10,2),
  "maxRedemptions" INTEGER,
  "redeemedCount" INTEGER NOT NULL DEFAULT 0,
  "customerId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_tenantId_code_key" ON "coupons"("tenantId", "code");
CREATE INDEX "coupons_tenantId_idx" ON "coupons"("tenantId");

ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Record which coupon was applied to an order.
ALTER TABLE "orders" ADD COLUMN "couponCode" TEXT;
