-- DropForeignKey
ALTER TABLE "public"."QuoteItem" DROP CONSTRAINT "QuoteItem_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Receivable" DROP CONSTRAINT "Receivable_order_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReceivableEntry" DROP CONSTRAINT "ReceivableEntry_receivable_fkey";

-- AlterTable
ALTER TABLE "public"."Receivable" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receivable" ADD CONSTRAINT "Receivable_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReceivableEntry" ADD CONSTRAINT "ReceivableEntry_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "public"."Receivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
