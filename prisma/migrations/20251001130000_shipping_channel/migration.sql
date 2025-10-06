-- Add ShippingChannel enum and column (shadow DB friendly, no DO $$)
CREATE TYPE "public"."ShippingChannel" AS ENUM ('ONLINE','TIENDA');

ALTER TABLE "public"."Shipping" ADD COLUMN "channel" "public"."ShippingChannel" NOT NULL DEFAULT 'TIENDA';

