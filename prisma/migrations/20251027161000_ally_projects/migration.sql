-- Create AllyProject table
CREATE TABLE IF NOT EXISTS "AllyProject" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "images" TEXT[] NOT NULL,
  "videoUrl" TEXT,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AllyProject_userId_createdAt_idx" ON "AllyProject"("userId", "createdAt");

