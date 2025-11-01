-- Add DeliveryStatus enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'DeliveryStatus') THEN
    CREATE TYPE "public"."DeliveryStatus" AS ENUM ('NONE','PENDING','APPROVED');
  END IF;
END $$;

-- Add columns to User
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "deliveryStatus" "public"."DeliveryStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "deliveryCedula" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryMotoPlate" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryChassisSerial" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryIdImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "deliverySelfieUrl" TEXT;