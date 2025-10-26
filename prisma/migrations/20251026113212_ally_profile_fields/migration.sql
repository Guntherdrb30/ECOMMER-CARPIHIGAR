-- Add ally profile fields to User
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "services" TEXT[],
  ADD COLUMN IF NOT EXISTS "portfolioUrls" TEXT[],
  ADD COLUMN IF NOT EXISTS "portfolioText" TEXT;
