import type {
  AestheticsConfig,
  AestheticsSchema,
} from '../lib/ProductSchema';

type EcpdColor = {
  name?: string;
  description?: string;
  image?: string;
};

type AestheticSelectorProps = {
  schema: AestheticsSchema;
  values: AestheticsConfig;
  onChange: (group: keyof AestheticsConfig, value: string) => void;
  ecpdColors?: EcpdColor[];
};

export default function AestheticSelector({
  schema,
  values,
  onChange,
  ecpdColors,
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

  const findColorMeta = (name: string): EcpdColor | undefined => {
    if (!ecpdColors || !ecpdColors.length) return undefined;
    const target = name.trim().toLowerCase();
    return ecpdColors.find(
      (c) => (c.name || '').trim().toLowerCase() === target,
    );
  };

  const renderColorsGroup = () => {
    const options = schema.colors;
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Color</h3>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => {
            const parts = opt.split('+').map((p) => p.trim());
            const metas = parts
              .map((p) => findColorMeta(p))
              .filter((m): m is EcpdColor => !!m && !!m.image);
            const isActive = values.colors === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange('colors', opt)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-brand'
                }`}
              >
                {metas.length > 0 && (
                  <span className="flex -space-x-1">
                    {metas.slice(0, 2).map((m, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${opt}-${idx}`}
                        src={m.image}
                        alt={m.name || opt}
                        className="w-6 h-6 rounded-full border border-gray-200 object-cover bg-gray-100"
                      />
                    ))}
                  </span>
                )}
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderColorsGroup()}
    </div>
  );
}
