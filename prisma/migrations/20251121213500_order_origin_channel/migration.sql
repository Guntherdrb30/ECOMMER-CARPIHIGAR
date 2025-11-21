-- Add originChannel column used to track the source of the order

ALTER TABLE "public"."Order"
  ADD COLUMN IF NOT EXISTS "originChannel" TEXT DEFAULT 'ONLINE';

