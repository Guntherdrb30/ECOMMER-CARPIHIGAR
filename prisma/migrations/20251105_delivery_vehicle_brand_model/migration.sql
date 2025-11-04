-- Add deliveryVehicleBrand / deliveryVehicleModel to User
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "deliveryVehicleBrand" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryVehicleModel" TEXT;

