-- Create QuoteStatus enum and Quote/QuoteItem tables
CREATE TYPE "public"."QuoteStatus" AS ENUM ('BORRADOR','ENVIADO','APROBADO','RECHAZADO','VENCIDO');

CREATE TABLE "public"."Quote" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sellerId" TEXT,
  "subtotalUSD" DECIMAL(10,2) NOT NULL,
  "ivaPercent" DECIMAL(5,2) NOT NULL,
  "tasaVES" DECIMAL(10,2) NOT NULL,
  "totalUSD" DECIMAL(10,2) NOT NULL,
  "totalVES" DECIMAL(12,2) NOT NULL,
  "status" "public"."QuoteStatus" NOT NULL DEFAULT 'BORRADOR',
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "customerTaxId" TEXT,
  "customerFiscalAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."Quote"
  ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Quote"
  ADD CONSTRAINT "Quote_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "public"."QuoteItem" (
  "id" TEXT PRIMARY KEY,
  "quoteId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceUSD" DECIMAL(10,2) NOT NULL,
  "quantity" INTEGER NOT NULL
);

ALTER TABLE "public"."QuoteItem"
  ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."QuoteItem"
  ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

