-- Add legal billing fields and correlatives for invoices/receipts

-- SiteSettings: legal company data and next numbers
ALTER TABLE "public"."SiteSettings"
  ADD COLUMN IF NOT EXISTS "legalCompanyName" TEXT,
  ADD COLUMN IF NOT EXISTS "legalCompanyRif" TEXT,
  ADD COLUMN IF NOT EXISTS "legalCompanyAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "legalCompanyPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceNextNumber" INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "receiptNextNumber" INTEGER DEFAULT 1;

-- Order: correlatives assigned when generating PDFs
ALTER TABLE "public"."Order"
  ADD COLUMN IF NOT EXISTS "invoiceNumber" INTEGER,
  ADD COLUMN IF NOT EXISTS "receiptNumber" INTEGER;

