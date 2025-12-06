'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

type LandingProduct = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  priceUSD: number | null;
};

export default function PersonalizerLanding({
  products,
}: {
  products: LandingProduct[];
}) {
  const [spaceImageUrl, setSpaceImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'image');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      const json: any = await res.json().catch(() => null);
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || 'No se pudo subir la imagen.');
      }
      setSpaceImageUrl(json.url as string);
      toast.success('Imagen de tu espacio cargada. Ahora elige un mueble.');
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string'
          ? err.message
          : 'No se pudo subir la imagen.';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const buildHref = (slug: string) => {
    if (!spaceImageUrl) return `/personalizar-muebles/${slug}`;
    const params = new URLSearchParams({ space: spaceImageUrl });
    return `/personalizar-muebles/${slug}?${params.toString()}`;
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase">
            ECPD · Personalizador de muebles
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Personaliza tus muebles en tu propio espacio
          </h1>
          <p className="text-gray-600">
            1) Sube una foto de tu espacio. 2) Elige el mueble a personalizar.
            3) Ajusta medidas y colores en el configurador y visualízalo sobre
            tu foto.
          </p>
        </header>

        <section className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-gray-100 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">
            1. Sube la imagen de tu espacio
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="text-xs"
            />
            {uploading && (
              <span className="text-xs text-gray-500">
                Subiendo imagen...
              </span>
            )}
            {spaceImageUrl && !uploading && (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                Imagen cargada · ahora elige un mueble
              </span>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {spaceImageUrl && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spaceImageUrl}
                alt="Tu espacio cargado"
                className="max-h-56 w-full object-cover rounded-lg border border-gray-100"
              />
            </div>
          )}
        </section>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Aún no hay muebles configurables dados de alta. Cuando crees
            productos configurables en el panel de administrador, aparecerán
            listados aquí.
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-800">
                2. ¿Qué mueble quieres personalizar en este espacio?
              </h2>
              {!spaceImageUrl && (
                <p className="text-[11px] text-gray-500">
                  Consejo: sube primero la foto de tu espacio para verlo
                  inmediatamente con el mueble elegido.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const img = (p.images || [])[0];
                const href = buildHref(p.slug);
                return (
                  <Link
                    key={p.id}
                    href={href}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-brand">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Haz clic para ajustar medidas, colores y verlo en tu
                        espacio.
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

