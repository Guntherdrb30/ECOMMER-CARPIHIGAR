// One-off helper to crear la tabla EcpdDesign en Postgres
// cuando Prisma aún no ha aplicado la migración.

/* eslint-disable no-console */

const { Client } = require("pg");

const sql = `
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

CREATE INDEX IF NOT EXISTS "EcpdDesign_userId_createdAt_idx"
  ON "public"."EcpdDesign"("userId", "createdAt");

ALTER TABLE "public"."EcpdDesign"
  ADD CONSTRAINT IF NOT EXISTS "EcpdDesign_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."EcpdDesign"
  ADD CONSTRAINT IF NOT EXISTS "EcpdDesign_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "public"."Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definido");
  }

  console.log("[ecpd] Conectando a la base de datos...");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    console.log("[ecpd] Aplicando DDL para tabla EcpdDesign (idempotente)...");
    await client.query(sql);
    console.log("[ecpd] Tabla EcpdDesign verificada/creada correctamente.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[ecpd] Error creando tabla EcpdDesign:", err);
  process.exit(1);
});
