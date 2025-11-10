-- Create enum and table for Courses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourseStatus') THEN
    CREATE TYPE "public"."CourseStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."Course" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "summary" TEXT,
  "curriculum" JSONB,
  "priceUSD" DECIMAL(10,2) NOT NULL,
  "status" "public"."CourseStatus" NOT NULL DEFAULT 'DRAFT',
  "heroImageUrl" TEXT,
  "videoUrl" TEXT,
  "saleStartAt" TIMESTAMP,
  "saleEndAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Course_slug_key" ON "public"."Course"("slug");
CREATE INDEX IF NOT EXISTS "Course_status_createdAt_idx" ON "public"."Course"("status","createdAt");

