-- Create RelatedProduct join table for self-referencing related products
CREATE TABLE IF NOT EXISTS "RelatedProduct" (
  "fromId" TEXT NOT NULL,
  "toId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RelatedProduct_pkey" PRIMARY KEY ("fromId", "toId"),
  CONSTRAINT "RelatedProduct_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RelatedProduct_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

