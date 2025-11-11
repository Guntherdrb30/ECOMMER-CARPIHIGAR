-- purchase_tokens and orders_temp
CREATE TABLE IF NOT EXISTS "OrdersTemp" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "totalUSD" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "shippingData" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PurchaseToken" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" TEXT NOT NULL,
  "orderTempId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "PurchaseToken_customer_idx" ON "PurchaseToken"("customerId");
CREATE INDEX IF NOT EXISTS "PurchaseToken_temp_token_idx" ON "PurchaseToken"("orderTempId","token");
