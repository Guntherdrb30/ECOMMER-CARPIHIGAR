import type {
  AestheticsConfig,
  AestheticsSchema,
} from '../lib/ProductSchema';

type AestheticSelectorProps = {
  schema: AestheticsSchema;
  values: AestheticsConfig;
  onChange: (group: keyof AestheticsConfig, value: string) => void;
};

export default function AestheticSelector({
  schema,
  values,
  onChange,
}: AestheticSelectorProps) {
  const renderGroup = (
    key: keyof AestheticsSchema,
    label: string,
    valueKey: keyof AestheticsConfig,
  ) => {
    const options = schema[key];
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{label}</h3>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(valueKey, opt)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                values[valueKey] === opt
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderGroup('doors', 'Puertas', 'doors')}
      {renderGroup('colors', 'Color', 'colors')}
      {renderGroup('handles', 'Tiradores', 'handles')}
    </div>
  );
}

