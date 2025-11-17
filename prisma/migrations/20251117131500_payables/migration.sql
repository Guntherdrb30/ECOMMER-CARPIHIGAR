-- Accounts Payable (Cuentas por Pagar)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayableStatus') THEN
    CREATE TYPE "PayableStatus" AS ENUM ('PENDIENTE','PARCIAL','PAGADO','CANCELADO');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Payable" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT NOT NULL UNIQUE REFERENCES "Purchase"("id") ON DELETE CASCADE,
  "supplierId" TEXT REFERENCES "Supplier"("id") ON DELETE SET NULL,
  "status" "PayableStatus" NOT NULL DEFAULT 'PENDIENTE',
  "totalUSD" DECIMAL(12,2) NOT NULL,
  "balanceUSD" DECIMAL(12,2) NOT NULL,
  "dueDate" TIMESTAMPTZ,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PayableEntry" (
  "id" TEXT PRIMARY KEY,
  "payableId" TEXT NOT NULL REFERENCES "Payable"("id") ON DELETE CASCADE,
  "amountUSD" DECIMAL(12,2) NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'USD',
  "method" "PaymentMethod",
  "bankAccountId" TEXT REFERENCES "BankAccount"("id") ON DELETE SET NULL,
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

