-- Recipe ingredients: link a menu item to inventory items with per-unit quantities.
CREATE TABLE "recipe_ingredients" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "qty" DECIMAL(12,3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recipe_ingredients_menuItemId_inventoryItemId_key" ON "recipe_ingredients"("menuItemId", "inventoryItemId");
CREATE INDEX "recipe_ingredients_tenantId_idx" ON "recipe_ingredients"("tenantId");
CREATE INDEX "recipe_ingredients_menuItemId_idx" ON "recipe_ingredients"("menuItemId");

ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
