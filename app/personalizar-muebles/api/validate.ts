import type { ProductConfig } from '../lib/ProductSchema';
import { ProductSchema, type ProductSchemaType } from '../lib/ProductSchema';
import {
  validateAll,
  type FullValidationResult,
} from '../lib/ConstraintEngine';

export function validateConfig(
  config: ProductConfig,
  schema: ProductSchemaType = ProductSchema,
): FullValidationResult {
  return validateAll(config, schema);
}

export type { FullValidationResult };

