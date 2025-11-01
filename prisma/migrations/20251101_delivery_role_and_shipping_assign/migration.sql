-- Add new role value
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'DELIVERY') THEN
    ALTER TYPE "public"."Role" ADD VALUE 'DELIVERY';
  END IF;
END $$;

-- Add assignment and delivery fee columns to Shipping
ALTER TABLE "public"."Shipping"
  ADD COLUMN IF NOT EXISTS "assignedToId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deliveryFeeUSD" DECIMAL(10,2);

-- Add FK for assignedToId
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Shipping_assignedToId_fkey'
  ) THEN
    ALTER TABLE "public"."Shipping" ADD CONSTRAINT "Shipping_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;