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

    const baseColorOptions = options.filter((opt) => !opt.includes('+'));
    const comboOptions = options.filter((opt) => opt.includes('+'));

    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Escoge tu color preferido
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Usa las muestras de melamina para elegir el acabado principal del mueble.
        </p>

        {/* Carrusel de colores base */}
        <div className="flex gap-4 overflow-x-auto pb-3">
          {baseColorOptions.map((opt) => {
            const meta = findColorMeta(opt);
            const isActive = values.colors === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange('colors', opt)}
                className={`flex-shrink-0 w-40 md:w-48 rounded-lg border p-3 text-left text-xs transition-all hover:shadow-md ${
                  isActive
                    ? 'border-brand bg-brand/5 ring-2 ring-brand/40'
                    : 'border-gray-200 bg-white hover:border-brand/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  {meta?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={meta.image}
                      alt={meta.name || opt}
                      className="w-8 h-8 rounded-full border object-cover bg-gray-100"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full border border-gray-300 bg-gray-100" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-[11px] text-gray-800 line-clamp-1">
                      {meta?.name || opt}
                    </div>
                    {meta?.description && (
                      <div className="text-[10px] text-gray-500 line-clamp-2">
                        {meta.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Opciones de combinaciones, si existen */}
        {comboOptions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Combinaciones de dos colores
            </h4>
            <div className="flex flex-wrap gap-2">
              {comboOptions.map((opt) => {
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
                    className={`px-3 py-1.5 rounded-full border text-[11px] transition-colors flex items-center gap-2 ${
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
                            className="w-5 h-5 rounded-full border border-gray-200 object-cover bg-gray-100"
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
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {renderColorsGroup()}
    </div>
  );
}
