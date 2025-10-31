-- Add optional link from Order to Quote to support ally workflows
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "originQuoteId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_originQuoteId_idx" ON "public"."Order"("originQuoteId");

