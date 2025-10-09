-- Messaging core: Channel/Direction/Status enums + Conversation/Message tables
-- Note: ConversationStatus enum and extra columns are added by a later migration (20251009_add_conversation_status)

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Channel') THEN
    CREATE TYPE "public"."Channel" AS ENUM ('WHATSAPP');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageDirection') THEN
    CREATE TYPE "public"."MessageDirection" AS ENUM ('IN','OUT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageStatus') THEN
    CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT','DELIVERED','READ','FAILED');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."Conversation" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "phone" TEXT NOT NULL,
  "channel" "public"."Channel" NOT NULL DEFAULT 'WHATSAPP',
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastMessageAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "public"."Conversation" ("userId");
CREATE INDEX IF NOT EXISTS "Conversation_phone_idx" ON "public"."Conversation" ("phone");
CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "public"."Conversation" ("lastMessageAt");

ALTER TABLE "public"."Conversation"
  ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Conversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."Message" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "direction" "public"."MessageDirection" NOT NULL,
  "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
  "type" TEXT NOT NULL DEFAULT 'TEXT',
  "text" TEXT,
  "mediaUrl" TEXT,
  "waMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "public"."Message" ("conversationId", "createdAt");

ALTER TABLE "public"."Message"
  ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

