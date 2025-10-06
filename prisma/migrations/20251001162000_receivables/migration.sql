-- Cuentas por cobrar: estado principal y abonos parciales
CREATE TYPE "public"."ReceivableStatus" AS ENUM ('PENDIENTE','PARCIAL','PAGADO','CANCELADO');

CREATE TABLE IF NOT EXISTS "public"."Receivable" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "status" "public"."ReceivableStatus" NOT NULL DEFAULT 'PENDIENTE',
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

ALTER TABLE "public"."Receivable"
  ADD CONSTRAINT "Receivable_order_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."ReceivableEntry" (
  "id" TEXT PRIMARY KEY,
  "receivableId" TEXT NOT NULL,
  "amountUSD" DECIMAL(12,2) NOT NULL,
  "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
  "method" "public"."PaymentMethod",
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

ALTER TABLE "public"."ReceivableEntry"
  ADD CONSTRAINT "ReceivableEntry_receivable_fkey" FOREIGN KEY ("receivableId") REFERENCES "public"."Receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;


