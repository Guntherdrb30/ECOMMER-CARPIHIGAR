'use client';

import HeroMediaUploader from '@/components/admin/hero-media-uploader';

type EcpdColor = {
  name?: string;
  description?: string;
  image?: string;
};

export default function EcpdColorsEditor({ defaultColors }: { defaultColors: EcpdColor[] }) {
  const slots: EcpdColor[] = [];
  for (let i = 0; i < 3; i++) {
    slots.push(defaultColors[i] || {});
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Colores de melamina (ECPD)</h3>
      <p className="text-sm text-gray-600 mb-3">
        Define los colores base del personalizador de muebles. Por ejemplo:{' '}
        <strong>Arena</strong>, <strong>Nogal oscuro</strong> y <strong>Gris claro</strong>. Cada
        color puede tener una imagen de muestra y una breve descripci&oacute;n.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((c, i) => (
          <div key={i} className="border rounded-lg p-3 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Color #{i + 1}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                name={`ecpdColorName${i}`}
                defaultValue={c.name || ''}
                placeholder={i === 0 ? 'Arena' : i === 1 ? 'Nogal oscuro' : i === 2 ? 'Gris claro' : ''}
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descripci&oacute;n
              </label>
              <textarea
                name={`ecpdColorDescription${i}`}
                defaultValue={c.description || ''}
                className="w-full border rounded px-2 py-1 text-xs min-h-[60px]"
                placeholder="Ej: Melamina efecto madera clara..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Imagen de muestra
              </label>
              <HeroMediaUploader
                targetInputName={`ecpdColorImage${i}`}
                defaultUrl={c.image || ''}
              />
              <input
                type="hidden"
                name={`ecpdColorImage${i}`}
                defaultValue={c.image || ''}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Estos colores se usar&aacute;n como opciones por defecto en el configurador ECPD. Puedes
        cambiarlos cuando quieras desde este panel.
      </p>
    </div>
  );
}

