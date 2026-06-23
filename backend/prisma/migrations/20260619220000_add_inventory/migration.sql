-- Inventory: items, received batches (with expiry + cost), and stock movements.
CREATE TABLE "inventory_items" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'unit',
  "reorderLevel" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "perishable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inventory_items_tenantId_idx" ON "inventory_items"("tenantId");
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "stock_batches" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "qty" DECIMAL(12,3) NOT NULL,
  "remainingQty" DECIMAL(12,3) NOT NULL,
  "unitCost" DECIMAL(12,4) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "stock_batches_tenantId_idx" ON "stock_batches"("tenantId");
CREATE INDEX "stock_batches_itemId_idx" ON "stock_batches"("itemId");
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "stock_movements" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "qty" DECIMAL(12,3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "stock_movements_tenantId_idx" ON "stock_movements"("tenantId");
CREATE INDEX "stock_movements_itemId_idx" ON "stock_movements"("itemId");
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
