-- Extend Currency enum to support USDT (Binance/cripto estable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Currency' AND e.enumlabel = 'USDT'
  ) THEN
    ALTER TYPE "Currency" ADD VALUE 'USDT';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add invoice metadata fields to Purchase
ALTER TABLE "Purchase"
  ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "baseAmountUSD" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "discountPercent" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "discountAmountUSD" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "ivaPercent" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "ivaAmountUSD" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "itemsCount" INTEGER;

-- Bank enums and tables for basic cash/bank tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BankTransactionType') THEN
    CREATE TYPE "BankTransactionType" AS ENUM ('DEBITO','CREDITO');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BankAccount" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "bankName" TEXT,
  "accountNumber" TEXT,
  "currency" "Currency" NOT NULL DEFAULT 'USD',
  "initialBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BankTransaction" (
  "id" TEXT PRIMARY KEY,
  "bankAccountId" TEXT NOT NULL REFERENCES "BankAccount"("id") ON DELETE CASCADE,
  "type" "BankTransactionType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'USD',
  "description" TEXT,
  "reference" TEXT,
  "purchaseId" TEXT REFERENCES "Purchase"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

