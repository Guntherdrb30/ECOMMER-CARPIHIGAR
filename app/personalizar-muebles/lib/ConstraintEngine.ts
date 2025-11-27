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

export function validateDimensions(
  input: ProductConfig,
  schema: ProductSchemaType,
): ValidationResult {
  const errors: string[] = [];
  const dims = input.dimensions;
  const schemaDims = schema.dimensions;

  (['width', 'depth', 'height'] as const).forEach((key) => {
    const value = dims[key];
    const range = schemaDims[key];
    if (value < range.min || value > range.max) {
      const label = translateDimensionKey(key);
      if (value < range.min) {
        errors.push(El  no puede ser menor a  cm.);
      } else if (value > range.max) {
        errors.push(El  no puede ser mayor a  cm.);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateComponents(
  _input: ProductConfig,
  _schema: ProductSchemaType,
): ValidationResult {
  // En esta versión del ECPD no validamos componentes internos,
  // porque el precio base ya incluye herrajes y módulos.
  return { valid: true, errors: [] };
}

export function validateConditionalRules(
  _input: ProductConfig,
  _schema: ProductSchemaType,
): ValidationResult {
  // Sin reglas condicionales (rodapié, etc.) por ahora.
  return { valid: true, errors: [] };
}

export type FullValidationResult = ValidationResult & {
  details: {
    dimensions: ValidationResult;
    components: ValidationResult;
    conditional: ValidationResult;
  };
};

export function validateAll(
  input: ProductConfig,
  schema: ProductSchemaType,
): FullValidationResult {
  const dimensions = validateDimensions(input, schema);
  const components = validateComponents(input, schema);
  const conditional = validateConditionalRules(input, schema);
  const allErrors = [
    ...dimensions.errors,
    ...components.errors,
    ...conditional.errors,
  ];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    details: { dimensions, components, conditional },
  };
}

