-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'VES');

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN "currency" "public"."Currency" NOT NULL DEFAULT 'USD';

