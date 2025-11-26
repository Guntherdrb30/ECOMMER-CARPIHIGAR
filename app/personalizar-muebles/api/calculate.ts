import type { ProductConfig } from '../lib/ProductSchema';
import { ProductSchema, type ProductSchemaType } from '../lib/ProductSchema';
import { calculatePrice } from '../lib/PricingEngine';

export function calculatePriceForConfig(
  config: ProductConfig,
  schema: ProductSchemaType = ProductSchema,
): number {
  return calculatePrice(config, schema);
}

