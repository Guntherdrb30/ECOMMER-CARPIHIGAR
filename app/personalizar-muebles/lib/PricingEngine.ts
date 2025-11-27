import {
  createDefaultConfig,
  type ProductConfig,
  type ProductSchemaType,
} from './ProductSchema';

function getDoorSurcharge(
  doors: string,
  schema: ProductSchemaType,
): number {
  if (doors === 'Una') return schema.pricing.surcharges.oneDoor;
  if (doors === 'Dos') return schema.pricing.surcharges.twoDoors;
  return 0;
}

function getRodapieSurcharge(
  rodapieAMedida: boolean,
  schema: ProductSchemaType,
): number {
  return rodapieAMedida
    ? schema.pricing.surcharges.rodapieAMedida
    : schema.pricing.surcharges.noRodapie;
}

export function calculatePrice(
  config: ProductConfig,
  schema: ProductSchemaType,
): number {
  const baseConfig = createDefaultConfig(schema);

  const baseVolume =
    baseConfig.dimensions.width *
      baseConfig.dimensions.depth *
      baseConfig.dimensions.height ||
    schema.pricing.referenceVolume ||
    1;

  const currentVolume =
    config.dimensions.width *
    config.dimensions.depth *
    config.dimensions.height;

  const percent = (currentVolume - baseVolume) / baseVolume;

  let price = schema.pricing.referencePrice * (1 + percent);

  const baseDoorSurcharge = getDoorSurcharge(
    baseConfig.aesthetics.doors,
    schema,
  );
  const currentDoorSurcharge = getDoorSurcharge(
    config.aesthetics.doors,
    schema,
  );

  const baseRodapieSurcharge = getRodapieSurcharge(
    baseConfig.components.rodapieAMedida,
    schema,
  );
  const currentRodapieSurcharge = getRodapieSurcharge(
    config.components.rodapieAMedida,
    schema,
  );

  price +=
    currentDoorSurcharge +
    currentRodapieSurcharge -
    (baseDoorSurcharge + baseRodapieSurcharge);

  return Math.round(price * 100) / 100;
}
