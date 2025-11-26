import type {
  ComponentsConfig,
  ComponentsSchema,
} from '../lib/ProductSchema';

type ComponentSelectorProps = {
  schema: ComponentsSchema;
  values: ComponentsConfig;
  onChange: (key: keyof ComponentsConfig, value: number | boolean) => void;
};

export default function ComponentSelector({
  schema,
  values,
  onChange,
}: ComponentSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Baldas
        </label>
        <input
          type="number"
          min={schema.shelves.min}
          max={schema.shelves.max}
          value={values.shelves}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onChange('shelves', v);
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Entre {schema.shelves.min} y {schema.shelves.max} baldas.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cajones
        </label>
        <input
          type="number"
          min={schema.drawers.min}
          max={schema.drawers.max}
          value={values.drawers}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onChange('drawers', v);
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Cada cajón consume {schema.drawers.spacePerDrawer} cm de altura.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Altura maletero (cm)
        </label>
        <input
          type="number"
          min={schema.maletero.min}
          max={schema.maletero.max}
          value={values.maletero}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onChange('maletero', v);
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Entre {schema.maletero.min} y {schema.maletero.max} cm.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Barra de colgar
          </span>
          <button
            type="button"
            onClick={() => onChange('hangingBar', !values.hangingBar)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              values.hangingBar ? 'bg-brand' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                values.hangingBar ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Rodapié
          </label>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="rodapie"
                checked={!values.rodapieAMedida}
                onChange={() => onChange('rodapieAMedida', false)}
                className="text-brand focus:ring-brand"
              />
              <span>Sin rodapié a medida</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="rodapie"
                checked={values.rodapieAMedida}
                onChange={() => onChange('rodapieAMedida', true)}
                className="text-brand focus:ring-brand"
              />
              <span>Rodapié a medida</span>
            </label>
          </div>
          {values.rodapieAMedida && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Altura rodapié (cm)
              </label>
              <input
                type="number"
                min={schema.rodapieAMedida.dimension.min}
                max={schema.rodapieAMedida.dimension.max}
                value={values.rodapieAMedidaDimension ?? ''}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  onChange('rodapieAMedidaDimension', v as any);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Entre {schema.rodapieAMedida.dimension.min} y{' '}
                {schema.rodapieAMedida.dimension.max} cm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

