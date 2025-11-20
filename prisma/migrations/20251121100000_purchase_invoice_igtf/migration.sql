-- Add legal invoice metadata and IGTF fields to Purchase
ALTER TABLE "Purchase"
  ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "igtfPercent" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "igtfAmountUSD" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "invoiceImageUrl" TEXT;

