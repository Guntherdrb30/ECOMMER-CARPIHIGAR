-- AlterTable: add brand to Product (required) and commissionPercent to User (optional)
ALTER TABLE "public"."Product"
ADD COLUMN "brand" TEXT NOT NULL DEFAULT 'SIN_MARCA';

ALTER TABLE "public"."User"
ADD COLUMN "commissionPercent" DECIMAL(5,2);

