-- Allow deleting menu items/categories without breaking historical orders.
-- Order items keep their snapshotted name/price; the menu link is nulled.
ALTER TABLE "order_items" ALTER COLUMN "menuItemId" DROP NOT NULL;

ALTER TABLE "order_items" DROP CONSTRAINT "order_items_menuItemId_fkey";

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
