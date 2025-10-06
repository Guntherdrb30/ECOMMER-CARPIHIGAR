-- Alter Category: add self-relation for hierarchy
ALTER TABLE "public"."Category" ADD COLUMN "parentId" TEXT;
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

