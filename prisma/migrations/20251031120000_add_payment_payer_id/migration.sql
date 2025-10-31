-- Add payerId to Payment for storing cedula/ID of payer
ALTER TABLE "public"."Payment" ADD COLUMN IF NOT EXISTS "payerId" TEXT;

