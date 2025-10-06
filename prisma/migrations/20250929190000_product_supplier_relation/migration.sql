-- AlterTable: add supplier relation to Product
ALTER TABLE "public"."Product"
  ADD COLUMN "supplierId" TEXT;

ALTER TABLE "public"."Product"
  ADD CONSTRAINT "Product_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

