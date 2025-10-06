-- Add SaleType enum and saleType/creditDueDate to Order
CREATE TYPE "public"."SaleType" AS ENUM ('CONTADO','CREDITO');

ALTER TABLE "public"."Order"
  ADD COLUMN IF NOT EXISTS "saleType" "public"."SaleType" NOT NULL DEFAULT 'CONTADO',
  ADD COLUMN IF NOT EXISTS "creditDueDate" TIMESTAMP(3);

