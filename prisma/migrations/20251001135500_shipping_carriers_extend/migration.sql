-- Extend ShippingCarrier enum (non-transactional; Prisma detects ALTER TYPE)
ALTER TYPE "public"."ShippingCarrier" ADD VALUE 'FLETE_PRIVADO';
ALTER TYPE "public"."ShippingCarrier" ADD VALUE 'RETIRO_TIENDA';
ALTER TYPE "public"."ShippingCarrier" ADD VALUE 'DELIVERY';