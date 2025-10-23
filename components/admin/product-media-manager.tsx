'use client';

import MainImageUploader from '@/components/admin/main-image-uploader';
import ImagesUploader from '@/components/admin/images-uploader';
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
  const hasCurrent = (defaultImages && defaultImages.length > 0) || !!defaultVideoUrl;
  return (
    <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <div key={u} className="w-20 h-20 border rounded overflow-hidden">
                      <img src={u} alt="img" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {defaultVideoUrl && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Video</div>
                {isVideoUrl(defaultVideoUrl) ? (
                  <video src={defaultVideoUrl || ''} className="w-full rounded max-h-40" controls />
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
          <MainImageUploader targetName={mainName} />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Imágenes adicionales (hasta {maxImages})</h3>
          <ImagesUploader targetName={imagesName} max={maxImages} />
        </div>
      </div>

      {/* Columna video */}
      <div className="border rounded p-3 bg-white">
        <h3 className="font-semibold mb-1">Video del producto (opcional)</h3>
        <HeroMediaUploader targetInputName={videoName} defaultUrl={defaultVideoUrl || undefined} />
        <p className="text-xs text-gray-500 mt-2">Formatos: MP4, WEBM, OGG. El video se muestra al final de la galería.</p>
      </div>
    </div>
  );
}

