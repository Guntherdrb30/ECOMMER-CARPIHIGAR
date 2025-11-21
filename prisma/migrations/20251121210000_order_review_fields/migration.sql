-- Add administrative review fields to Order for backoffice flows

ALTER TABLE "public"."Order"
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

-- Optional index to speed up queries by reviewer
CREATE INDEX IF NOT EXISTS "Order_reviewedById_idx"
  ON "public"."Order"("reviewedById");

-- Foreign key to User (reviewer); nullable, does not cascade deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Order_reviewedById_fkey'
  ) THEN
    ALTER TABLE "public"."Order"
      ADD CONSTRAINT "Order_reviewedById_fkey"
      FOREIGN KEY ("reviewedById")
      REFERENCES "public"."User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

