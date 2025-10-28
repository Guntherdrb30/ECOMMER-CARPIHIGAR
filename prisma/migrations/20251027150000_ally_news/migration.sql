-- Create News table for ally projects
CREATE TABLE IF NOT EXISTS "News" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "imageUrl" TEXT NOT NULL,
  "title" TEXT,
  "excerpt" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "News_createdAt_idx" ON "News"("createdAt");
CREATE INDEX IF NOT EXISTS "News_authorId_createdAt_idx" ON "News"("authorId", "createdAt");

