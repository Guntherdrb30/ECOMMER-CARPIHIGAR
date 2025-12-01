-- CreateTable
CREATE TABLE "public"."Moodboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jsonData" JSONB NOT NULL,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moodboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Moodboard_userId_updatedAt_idx" ON "public"."Moodboard"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."Moodboard"
ADD CONSTRAINT "Moodboard_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

