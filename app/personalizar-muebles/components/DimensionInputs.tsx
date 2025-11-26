import type {
  DimensionsConfig,
  DimensionsSchema,
  DimensionKey,
} from '../lib/ProductSchema';

type DimensionInputsProps = {
  schema: DimensionsSchema;
  values: DimensionsConfig;
  onChange: (key: DimensionKey, value: number) => void;
};

const labels: Record<DimensionKey, string> = {
  width: 'Ancho',
  depth: 'Profundidad',
  height: 'Altura',
};

export default function DimensionInputs({
  schema,
  values,
  onChange,
}: DimensionInputsProps) {
  const keys: DimensionKey[] = ['width', 'height', 'depth'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {keys.map((key) => {
        const range = schema[key];
        const value = values[key];
        return (
          <div key={key} className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {labels[key]} (cm)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={range.min}
                max={range.max}
                value={value}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  onChange(key, next);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <span className="text-xs text-gray-500">
                {range.min}–{range.max}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

