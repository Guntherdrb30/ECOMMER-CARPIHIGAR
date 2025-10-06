-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDIENTE', 'PAGADA');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'VENDEDOR';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "sellerId" TEXT;

-- AlterTable
ALTER TABLE "public"."SiteSettings" ADD COLUMN     "sellerCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "public"."Commission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "amountUSD" DECIMAL(10,2) NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_orderId_key" ON "public"."Commission"("orderId");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commission" ADD CONSTRAINT "Commission_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
