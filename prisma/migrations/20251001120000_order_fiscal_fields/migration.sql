-- Add fiscal fields to Order for invoices
ALTER TABLE "public"."Order"
  ADD COLUMN IF NOT EXISTS "customerTaxId" TEXT,
  ADD COLUMN IF NOT EXISTS "customerFiscalAddress" TEXT;

