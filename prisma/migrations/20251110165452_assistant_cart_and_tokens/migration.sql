-- Create AssistantCart, AssistantCartItem, OrderAuthToken
CREATE TABLE IF NOT EXISTS "AssistantCart" (
  "id" TEXT PRIMARY KEY,
  "ownerKey" TEXT NOT NULL,
  "userId" TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "AssistantCart_ownerKey_idx" ON "AssistantCart"("ownerKey");

ALTER TABLE "AssistantCart"
  ADD CONSTRAINT "AssistantCart_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "AssistantCartItem" (
  "id" TEXT PRIMARY KEY,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceUSD" NUMERIC(10,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "AssistantCartItem_cart_fkey" FOREIGN KEY ("cartId") REFERENCES "AssistantCart"("id") ON DELETE CASCADE,
  CONSTRAINT "AssistantCartItem_product_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "AssistantCartItem_cart_product_unique" ON "AssistantCartItem"("cartId","productId");

CREATE TABLE IF NOT EXISTS "OrderAuthToken" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "channel" TEXT NULL,
  "destination" TEXT NULL,
  CONSTRAINT "OrderAuthToken_order_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrderAuthToken_order_token_unique" ON "OrderAuthToken"("orderId","token");
