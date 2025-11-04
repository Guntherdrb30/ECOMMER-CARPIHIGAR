-- Add deliveryVehicleType to User for vehicle registration type
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "deliveryVehicleType" TEXT;

