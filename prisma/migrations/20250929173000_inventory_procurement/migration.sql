-- CreateEnum
CREATE TYPE "public"."CostMethod" AS ENUM ('PROMEDIO','FIFO');
CREATE TYPE "public"."POStatus" AS ENUM ('DRAFT','ORDERED','RECEIVED','CANCELLED');

-- AlterTable Product
ALTER TABLE "public"."Product"
  ADD COLUMN "reorderPoint" INTEGER,
  ADD COLUMN "safetyStock" INTEGER,
  ADD COLUMN "leadTimeDays" INTEGER,
  ADD COLUMN "costMethod" "public"."CostMethod" NOT NULL DEFAULT 'PROMEDIO',
  ADD COLUMN "avgCost" DECIMAL(10,2),
  ADD COLUMN "lastCost" DECIMAL(10,2);

-- CreateTable Supplier
CREATE TABLE "public"."Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "taxId" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable PurchaseOrder
CREATE TABLE "public"."PurchaseOrder" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "status" "public"."POStatus" NOT NULL DEFAULT 'DRAFT',
  "expectedAt" TIMESTAMP(3),
  "totalUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable PurchaseOrderItem
CREATE TABLE "public"."PurchaseOrderItem" (
  "id" TEXT NOT NULL,
  "poId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "received" INTEGER NOT NULL DEFAULT 0,
  "costUSD" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- FKs
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

