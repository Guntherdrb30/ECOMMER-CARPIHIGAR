-- AlterTable: add payer details for Pago Móvil
ALTER TABLE "public"."Payment"
  ADD COLUMN "payerName" TEXT,
  ADD COLUMN "payerPhone" TEXT,
  ADD COLUMN "payerBank" TEXT;

