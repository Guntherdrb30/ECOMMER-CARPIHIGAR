-- Add optional fields for Category landing pages
ALTER TABLE "public"."Category"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
