/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."SiteSettings" ADD COLUMN     "homeHeroUrls" TEXT[],
ADD COLUMN     "rootPhone" TEXT,
ADD COLUMN     "rootRecoveryHash" TEXT,
ADD COLUMN     "rootResetCode" TEXT,
ADD COLUMN     "rootResetCodeExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "passwordResetTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "public"."User"("passwordResetToken");
