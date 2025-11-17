-- Extend Supplier with RIF image, contact and credit terms

ALTER TABLE "Supplier"
  ADD COLUMN IF NOT EXISTS "rifImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "contactName" TEXT,
  ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "givesCredit" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "creditDays" INTEGER;

