-- Extend Product with pricing/margin fields
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "code" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Product_code_key'
  ) THEN
    CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
  END IF;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceWholesaleUSD" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "costUSD" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "marginClientPct" DECIMAL(5,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "marginAllyPct" DECIMAL(5,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "marginWholesalePct" DECIMAL(5,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceClientUSD" DECIMAL(10,2);

-- Purchases header
CREATE TABLE IF NOT EXISTS "Purchase" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'USD',
  "tasaVES" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subtotalUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "createdById" TEXT NULL,
  CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Purchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

-- Purchase items
CREATE TABLE IF NOT EXISTS "PurchaseItem" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "costUSD" DECIMAL(10,2) NOT NULL,
  "subtotalUSD" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);

