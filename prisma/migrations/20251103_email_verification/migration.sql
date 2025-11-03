DO $$
BEGIN
  -- Add columns if not exist (idempotent for deploy)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='emailVerifiedAt'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "emailVerifiedAt" TIMESTAMP NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='emailVerificationToken'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "emailVerificationToken" TEXT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='emailVerificationTokenExpiresAt'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP NULL;
  END IF;
  -- Unique index for token
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='User_emailVerificationToken_key'
  ) THEN
    CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "public"."User" ("emailVerificationToken");
  END IF;
END $$;
