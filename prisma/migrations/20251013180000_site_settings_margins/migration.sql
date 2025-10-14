-- Add missing margin columns to SiteSettings (for production DBs not yet migrated)
ALTER TABLE "public"."SiteSettings"
  ADD COLUMN IF NOT EXISTS "defaultMarginClientPct" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "defaultMarginAllyPct" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "defaultMarginWholesalePct" DECIMAL(5,2);

