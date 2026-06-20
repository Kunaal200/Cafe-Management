-- Menu item attributes: spicy/sweet badges and serving size.
ALTER TABLE "menu_items" ADD COLUMN "isSpicy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu_items" ADD COLUMN "isSweet" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu_items" ADD COLUMN "serves" INTEGER;

-- Sequential, human-friendly order number. SERIAL backfills existing rows.
ALTER TABLE "orders" ADD COLUMN "orderNumber" SERIAL NOT NULL;
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
