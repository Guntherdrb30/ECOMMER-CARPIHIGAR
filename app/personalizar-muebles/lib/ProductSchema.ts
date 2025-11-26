export type DimensionKey = 'width' | 'depth' | 'height';

export type DimensionRange = {
  min: number;
  max: number;
};

export type DimensionsSchema = {
  width: DimensionRange;
  depth: DimensionRange;
  height: DimensionRange;
};

export type ComponentsSchema = {
  shelves: { min: number; max: number; spacePerShelf?: number };
  drawers: { min: number; max: number; spacePerDrawer: number };
  maletero: { min: number; max: number };
  hangingBar: { type: 'boolean' };
  rodapieAMedida: {
    type: 'conditional';
    requires: string;
    dimension: DimensionRange;
  };
};

export type AestheticsSchema = {
  doors: string[];
  colors: string[];
  handles: string[];
};

export type PricingSchema = {
  referencePrice: number;
  referenceVolume: number;
  surcharges: {
    oneDoor: number;
    twoDoors: number;
    noRodapie: number;
    rodapieAMedida: number;
  };
};

export type ProductSchemaType = {
  name: string;
  dimensions: DimensionsSchema;
  components: ComponentsSchema;
  aesthetics: AestheticsSchema;
  pricing: PricingSchema;
};

export type DimensionsConfig = {
  width: number;
  depth: number;
  height: number;
};

export type ComponentsConfig = {
  shelves: number;
  drawers: number;
  maletero: number;
  hangingBar: boolean;
  rodapieAMedida: boolean;
  rodapieAMedidaDimension?: number;
};

export type AestheticsConfig = {
  doors: string;
  colors: string;
  handles: string;
};

export type ProductConfig = {
  dimensions: DimensionsConfig;
  components: ComponentsConfig;
  aesthetics: AestheticsConfig;
};

export const ProductSchema: ProductSchemaType = {
  name: 'Armario Nidus',
  dimensions: {
    width: { min: 130, max: 230 },
    depth: { min: 30, max: 110 },
    height: { min: 33, max: 65 },
  },
  components: {
    shelves: { min: 1, max: 7 },
    drawers: { min: 1, max: 3, spacePerDrawer: 20 },
    maletero: { min: 0, max: 50 },
    hangingBar: { type: 'boolean' },
    rodapieAMedida: {
      type: 'conditional',
      requires: 'rodapieAMedida',
      dimension: { min: 6, max: 20 },
    },
  },
  aesthetics: {
    doors: ['Una', 'Dos', 'Sin puertas'],
    colors: ['Blanco', 'Antracita', 'Roble', 'Blanco/roble'],
    handles: ['Tirador Japón', 'Tirador Alemania', 'Niquel', 'Negro'],
  },
  pricing: {
    referencePrice: 300,
    referenceVolume: 130 * 30 * 33,
    surcharges: {
      oneDoor: 14.99,
      twoDoors: 29.99,
      noRodapie: 2,
      rodapieAMedida: 7,
    },
  },
};

export function createDefaultConfig(schema: ProductSchemaType): ProductConfig {
  const { dimensions, components, aesthetics } = schema;
  return {
    dimensions: {
      width: dimensions.width.min,
      depth: dimensions.depth.min,
      height: dimensions.height.min,
    },
    components: {
      shelves: components.shelves.min,
      drawers: components.drawers.min,
      maletero: components.maletero.min,
      hangingBar: false,
      rodapieAMedida: false,
      rodapieAMedidaDimension: components.rodapieAMedida.dimension.min,
    },
    aesthetics: {
      doors: aesthetics.doors[0],
      colors: aesthetics.colors[0],
      handles: aesthetics.handles[0],
    },
  };
}

