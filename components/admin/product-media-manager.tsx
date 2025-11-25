'use client';

import { useState } from 'react';
import MainImageUploader from '@/components/admin/main-image-uploader';
import ImagesUploader from '@/components/admin/images-uploader2';
import HeroMediaUploader from '@/components/admin/hero-media-uploader';

function isVideoUrl(url?: string | null) {
  if (!url) return false;
  const s = String(url).toLowerCase();
  return s.endsWith('.mp4') || s.endsWith('.webm') || s.endsWith('.ogg');
}

export default function ProductMediaManager({
  defaultImages,
  defaultVideoUrl,
  mainName = 'mainImage',
  imagesName = 'images[]',
  videoName = 'videoUrl',
  maxImages = 3,
}: {
  defaultImages?: string[];
  defaultVideoUrl?: string | null;
  mainName?: string;
  imagesName?: string;
  videoName?: string;
  maxImages?: number;
}) {
  const hasCurrentImages = !!defaultImages && defaultImages.length > 0;
  const hasCurrent = hasCurrentImages || !!defaultVideoUrl;

  const [replaceMode, setReplaceMode] = useState<'keep' | 'replace' | null>(
    hasCurrentImages ? null : 'keep',
  );

  const handleBeforeFirstUpload = () => {
    if (!hasCurrentImages) {
      if (replaceMode === null) setReplaceMode('keep');
      return 'keep' as const;
    }
    if (replaceMode) return replaceMode;

    const confirmReplace = window.confirm(
      'Este producto ya tiene imágenes guardadas.\n\n' +
        '¿Quieres eliminar las imágenes anteriores y dejar solo las nuevas?\n\n' +
        'Aceptar: se eliminan las actuales y se guardan solo las nuevas.\n' +
        'Cancelar: se mantienen las actuales y se agregan las nuevas al final.',
    );
    const mode = confirmReplace ? 'replace' : 'keep';
    setReplaceMode(mode);
    return mode;
  };

  return (
    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      {/* Columna de actuales */}
      <div className="border rounded p-3 bg-white">
        <h3 className="font-semibold mb-2">Actuales</h3>
        {!hasCurrent ? (
          <div className="text-sm text-gray-500">Sin archivos actuales</div>
        ) : (
          <div className="space-y-3">
            {defaultImages && defaultImages.length > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Imágenes</div>
                <div className="flex gap-2 flex-wrap">
                  {defaultImages.map((u) => (
                    <div
                      key={u}
                      className="w-20 h-20 border rounded overflow-hidden bg-gray-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="img" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  Al subir nuevas imágenes se te preguntará si quieres reemplazar estas
                  o mantenerlas y agregar las nuevas.
                </p>
              </div>
            )}
            {defaultVideoUrl && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Video</div>
                {isVideoUrl(defaultVideoUrl) ? (
                  <video
                    src={defaultVideoUrl || ''}
                    className="w-full rounded max-h-40"
                    controls
                  />
                ) : (
                  <div className="text-xs text-gray-500">URL actual: {defaultVideoUrl}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columna imagen principal + adicionales */}
      <div className="border rounded p-3 bg-white space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Imagen principal</h3>
          <p className="text-xs text-gray-500 mb-2">
            Si no subes una imagen principal, se usará la primera imagen de la galería.
          </p>
          <MainImageUploader
            targetName={mainName}
            onBeforeFirstUpload={handleBeforeFirstUpload}
          />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Imágenes adicionales (hasta {maxImages})</h3>
          <ImagesUploader
            targetName={imagesName}
            max={maxImages}
            initialCount={defaultImages?.length || 0}
            onBeforeFirstUpload={handleBeforeFirstUpload}
          />
        </div>
        <input
          type="hidden"
          name="replaceAllImages"
          value={replaceMode === 'replace' ? 'true' : 'false'}
        />
      </div>

      {/* Columna video */}
      <div className="border rounded p-3 bg-white">
        <h3 className="font-semibold mb-1">Video del producto (opcional)</h3>
        <HeroMediaUploader
          targetInputName={videoName}
          defaultUrl={defaultVideoUrl || undefined}
        />
        <input type="hidden" name={videoName} defaultValue={defaultVideoUrl || ''} />
        <p className="text-xs text-gray-500 mt-2">
          Formatos: MP4, WEBM, OGG. El video se muestra al final de la galería.
        </p>
      </div>
    </div>
  );
}
