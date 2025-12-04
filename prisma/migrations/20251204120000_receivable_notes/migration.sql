-- Notas de crédito / débito asociadas a cuentas por cobrar

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ReceivableNoteType'
  ) THEN
    CREATE TYPE "public"."ReceivableNoteType" AS ENUM ('CREDITO','DEBITO');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "public"."ReceivableNote" (
  "id" TEXT PRIMARY KEY,
  "receivableId" TEXT NOT NULL,
  "type" "public"."ReceivableNoteType" NOT NULL,
  "amountUSD" DECIMAL(12,2) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

ALTER TABLE "public"."ReceivableNote"
  ADD CONSTRAINT "ReceivableNote_receivable_fkey"
  FOREIGN KEY ("receivableId") REFERENCES "public"."Receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

