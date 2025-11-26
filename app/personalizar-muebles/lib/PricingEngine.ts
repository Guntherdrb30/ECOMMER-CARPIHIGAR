import type { ProductConfig, ProductSchemaType } from './ProductSchema';

export function calculatePrice(config: ProductConfig, schema: ProductSchemaType): number {
  const { width, depth, height } = config.dimensions;

  const volume = width * depth * height;
  const percent =
    (volume - schema.pricing.referenceVolume) / schema.pricing.referenceVolume;

  let price = schema.pricing.referencePrice * (1 + percent);

  if (config.aesthetics.doors === 'Una') price += schema.pricing.surcharges.oneDoor;
  if (config.aesthetics.doors === 'Dos') price += schema.pricing.surcharges.twoDoors;

  if (config.components.rodapieAMedida === false) {
    price += schema.pricing.surcharges.noRodapie;
  }
  if (config.components.rodapieAMedida === true) {
    price += schema.pricing.surcharges.rodapieAMedida;
  }

  return Math.round(price * 100) / 100;
}

