-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."EcpdDesign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "spaceImageUrl" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "overlayX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "overlayY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "overlayScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "overlayRotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceUSD" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcpdDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EcpdDesign_userId_createdAt_idx" ON "public"."EcpdDesign"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."EcpdDesign"
ADD CONSTRAINT IF NOT EXISTS "EcpdDesign_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."EcpdDesign"
ADD CONSTRAINT IF NOT EXISTS "EcpdDesign_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "public"."Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
