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
    const selectedValue = values.colors || '';
    const normalizedSelected = selectedValue.trim().toLowerCase();
    const baseSelectedName =
      normalizedSelected.split('+')[0]?.trim().toLowerCase() ||
      normalizedSelected;
    const selectedMeta =
      findColorMeta(baseSelectedName) || findColorMeta(selectedValue);

    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Escoge tu color preferido
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Usa las muestras de melamina para elegir el acabado principal del mueble.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)] gap-6">
          {/* Vista grande del color seleccionado */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-600">
              Vista previa del color seleccionado
            </div>
            <div className="relative w-full h-56 md:h-64 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
              {selectedMeta?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMeta.image}
                  alt={selectedMeta.name || selectedValue || 'Color seleccionado'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
                  <div className="w-20 h-20 rounded-full border border-dashed border-gray-300 bg-white" />
                  <span>Selecciona un color para ver la muestra</span>
                </div>
              )}
              {selectedMeta?.name && (
                <div className="absolute bottom-0 inset-x-0 bg-black/45 text-white text-xs px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">
                      {selectedMeta.name}
                    </div>
                    {selectedMeta.description && (
                      <div className="text-[11px] opacity-90 line-clamp-2">
                        {selectedMeta.description}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/20 border border-white/40">
                    Color seleccionado
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de colores base */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">
              Colores disponibles
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {baseColorOptions.map((opt) => {
                const meta = findColorMeta(opt);
                const isActive = values.colors === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange('colors', opt)}
                    className={`flex flex-col rounded-lg border bg-white overflow-hidden text-left text-xs transition-all hover:shadow-md ${
                      isActive
                        ? 'border-brand ring-2 ring-brand/40'
                        : 'border-gray-200 hover:border-brand/60'
                    }`}
                  >
                    <div className="relative w-full h-24 md:h-28 bg-gray-100 overflow-hidden">
                      {meta?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={meta.image}
                          alt={meta.name || opt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 border-b border-gray-200" />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-[11px] font-semibold">
                          Elegir color
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-1">
                      <div className="font-semibold text-[11px] text-gray-800 line-clamp-1">
                        {meta?.name || opt}
                      </div>
                      {meta?.description && (
                        <div className="text-[10px] text-gray-500 line-clamp-2">
                          {meta.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
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
