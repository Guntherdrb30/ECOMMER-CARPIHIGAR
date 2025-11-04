DO $$
BEGIN
  -- Add columns if not exist (idempotent for deploy)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='emailVerifiedAt'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "emailVerifiedAt" TIMESTAMP NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='emailVerificationToken'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "emailVerificationToken" TEXT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='emailVerificationTokenExpiresAt'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP NULL;
  END IF;

  -- Normalize existing data before creating unique index
  -- Convert empty-string tokens to NULL
  UPDATE "public"."User"
    SET "emailVerificationToken" = NULL
  WHERE "emailVerificationToken" = '';

  -- Null out duplicates to satisfy unique index creation
  WITH dups AS (
    SELECT "emailVerificationToken" AS token
    FROM "public"."User"
    WHERE "emailVerificationToken" IS NOT NULL AND "emailVerificationToken" <> ''
    GROUP BY 1 HAVING COUNT(*) > 1
  )
  UPDATE "public"."User" u
    SET "emailVerificationToken" = NULL
  FROM dups
  WHERE u."emailVerificationToken" = dups.token;

  -- Unique index for token (only for non-null, non-empty tokens)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='User_emailVerificationToken_key'
  ) THEN
    CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "public"."User" ("emailVerificationToken")
    WHERE "emailVerificationToken" IS NOT NULL AND "emailVerificationToken" <> '';
  END IF;
END $$;
