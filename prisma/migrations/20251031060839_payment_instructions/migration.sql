-- Payment instructions fields on SiteSettings
ALTER TABLE "public"."SiteSettings"
  ADD COLUMN IF NOT EXISTS "paymentZelleEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentPmPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentPmRif" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentPmBank" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentBanescoAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentBanescoRif" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentBanescoName" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMercantilAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMercantilRif" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMercantilName" TEXT;
