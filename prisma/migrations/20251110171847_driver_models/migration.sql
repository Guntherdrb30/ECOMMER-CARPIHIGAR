-- ShipmentPhoto and DriverLocation tables
CREATE TABLE IF NOT EXISTS "ShipmentPhoto" (
  "id" TEXT PRIMARY KEY,
  "shipmentId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ShipmentPhoto_shipment_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipping"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ShipmentPhoto_shipment_idx" ON "ShipmentPhoto"("shipmentId");

CREATE TABLE IF NOT EXISTS "DriverLocation" (
  "id" TEXT PRIMARY KEY,
  "driverId" TEXT NOT NULL,
  "lat" NUMERIC(10,7) NOT NULL,
  "lng" NUMERIC(10,7) NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "DriverLocation_driver_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DriverLocation_driver_idx" ON "DriverLocation"("driverId");
