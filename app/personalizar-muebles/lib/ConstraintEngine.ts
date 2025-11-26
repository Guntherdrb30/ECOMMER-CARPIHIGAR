import type { ProductConfig, ProductSchemaType } from './ProductSchema';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function translateDimensionKey(key: 'width' | 'depth' | 'height'): string {
  if (key === 'width') return 'ancho';
  if (key === 'depth') return 'profundidad';
  return 'altura';
}

export function validateDimensions(input: ProductConfig, schema: ProductSchemaType): ValidationResult {
  const errors: string[] = [];
  const dims = input.dimensions;
  const schemaDims = schema.dimensions;

  (['width', 'depth', 'height'] as const).forEach((key) => {
    const value = dims[key];
    const range = schemaDims[key];
    if (value < range.min || value > range.max) {
      errors.push(
        `La ${translateDimensionKey(key)} debe estar entre ${range.min} y ${range.max} cm.`
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateComponents(input: ProductConfig, schema: ProductSchemaType): ValidationResult {
  const errors: string[] = [];
  const c = input.components;
  const sc = schema.components;

  const checkRange = (value: number, range: { min: number; max: number }, label: string) => {
    if (value < range.min || value > range.max) {
      errors.push(`La cantidad de ${label} debe estar entre ${range.min} y ${range.max}.`);
    }
  };

  checkRange(c.shelves, sc.shelves, 'baldas');
  checkRange(c.drawers, sc.drawers, 'cajones');
  checkRange(c.maletero, sc.maletero, 'maletero');

  const spacePerDrawer = sc.drawers.spacePerDrawer ?? 0;
  const usedByDrawers = c.drawers * spacePerDrawer;
  const totalHeight = input.dimensions.height;

  if (usedByDrawers > totalHeight) {
    errors.push('La altura disponible no permite la cantidad de cajones seleccionada.');
  }

  const spacePerShelf = sc.shelves.spacePerShelf ?? 0;
  const usedByShelves = c.shelves * spacePerShelf;
  const totalUsed = usedByDrawers + usedByShelves;

  if (totalUsed > totalHeight) {
    errors.push('La altura ocupada por cajones y baldas no puede exceder la altura total del armario.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateConditionalRules(input: ProductConfig, schema: ProductSchemaType): ValidationResult {
  const errors: string[] = [];

  if (input.components.rodapieAMedida) {
    const dim = input.components.rodapieAMedidaDimension;
    const range = schema.components.rodapieAMedida.dimension;
    if (typeof dim !== 'number' || Number.isNaN(dim)) {
      errors.push('Debes indicar la altura del rodapié a medida.');
    } else if (dim < range.min || dim > range.max) {
      errors.push(
        `La altura del rodapié a medida debe estar entre ${range.min} y ${range.max} cm.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export type FullValidationResult = ValidationResult & {
  details: {
    dimensions: ValidationResult;
    components: ValidationResult;
    conditional: ValidationResult;
  };
};

export function validateAll(input: ProductConfig, schema: ProductSchemaType): FullValidationResult {
  const dimensions = validateDimensions(input, schema);
  const components = validateComponents(input, schema);
  const conditional = validateConditionalRules(input, schema);
  const allErrors = [...dimensions.errors, ...components.errors, ...conditional.errors];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    details: { dimensions, components, conditional },
  };
}

