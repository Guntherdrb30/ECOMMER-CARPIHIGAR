import type { ProductConfig } from './ProductSchema';

export async function generateConfigImage(
  _config: ProductConfig,
): Promise<string | null> {
  return null;
}

export async function suggestValidCombinations(
  _partialConfig: Partial<ProductConfig>,
): Promise<ProductConfig[]> {
  return [];
}

export async function savePreset(
  _name: string,
  _config: ProductConfig,
): Promise<void> {
  return;
}

export async function exportDesignAsPdf(
  _config: ProductConfig,
): Promise<Blob | null> {
  return null;
}

