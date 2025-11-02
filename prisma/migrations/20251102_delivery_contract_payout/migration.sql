-- Delivery contract acceptance on User, payout tracking on Shipping
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "deliveryAgreementAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveryAgreementVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "deliveryAgreementIp" TEXT;

ALTER TABLE "public"."Shipping"
  ADD COLUMN IF NOT EXISTS "deliveryPaidAt" TIMESTAMP(3);
