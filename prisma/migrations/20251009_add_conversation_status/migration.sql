-- Safe no-op if Conversation already has columns (applies when table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Conversation') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='ConversationStatus') THEN
      CREATE TYPE "public"."ConversationStatus" AS ENUM ('OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED');
    END IF;
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "status" "ConversationStatus" DEFAULT 'OPEN';
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP;
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP;
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "lastInboundAt" TIMESTAMP;
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "lastOutboundAt" TIMESTAMP;
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "unreadAgent" INTEGER DEFAULT 0;
    ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "unreadCustomer" INTEGER DEFAULT 0;
  END IF;
END $$;