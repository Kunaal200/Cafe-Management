-- Subcategories: categories can nest under a parent category.
ALTER TABLE "menu_categories" ADD COLUMN "parentId" TEXT;

CREATE INDEX "menu_categories_parentId_idx" ON "menu_categories"("parentId");

ALTER TABLE "menu_categories"
  ADD CONSTRAINT "menu_categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "menu_categories"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
