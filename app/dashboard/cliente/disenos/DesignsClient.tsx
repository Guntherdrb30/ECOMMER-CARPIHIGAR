'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

type Overlay = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type Design = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productSku: string | null;
  productImage: string | null;
  spaceImageUrl: string;
  overlay: Overlay;
  priceUSD: number;
  createdAt: string;
};

export default function DesignsClient({ designs }: { designs: Design[] }) {
  const [items, setItems] = useState<Design[]>(designs);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este diseño personalizado?')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/ecpd-designs/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json: any = await res.json().catch(() => null);
        const msg = json?.message || json?.error || 'No se pudo eliminar el diseño.';
        toast.error(String(msg));
        return;
      }
      setItems((prev) => prev.filter((d) => d.id !== id));
      toast.success('Diseño eliminado.');
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string'
          ? err.message
          : 'No se pudo eliminar el diseño.';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-800">
          Mis diseños personalizados
        </h1>
        <p className="text-xs text-gray-500">
          Puedes guardar hasta 5 diseños. Si llegas al límite, elimina uno para
          crear un nuevo diseño.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          Aún no has guardado diseños personalizados. Ve al personalizador de
          muebles, configura tu mueble y guarda tu diseño desde ahí.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((d) => {
            const created = new Date(d.createdAt);
            return (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {/* Fondo: foto del espacio */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.spaceImageUrl}
                    alt="Espacio personalizado"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Overlay aproximado del mueble */}
                  {d.productImage && (
                    <div
                      className="absolute"
                      style={{
                        left: `${d.overlay.x * 100}%`,
                        top: `${d.overlay.y * 100}%`,
                        transform: `translate(-50%, -50%) scale(${d.overlay.scale}) rotate(${d.overlay.rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.productImage}
                        alt={d.productName}
                        className="max-w-[40vw] md:max-w-[18vw] h-auto drop-shadow-xl"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">
                        {d.productName}
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {d.productSku && (
                          <>
                            Código: {d.productSku}
                            {' · '}
                          </>
                        )}
                        Guardado el{' '}
                        {created.toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold text-brand">
                      ${d.priceUSD.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link
                      href={`/personalizar-muebles/diseno/${d.id}`}
                      className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800"
                    >
                      Ver / editar diseño
                    </Link>
                    <Link
                      href={`/personalizar-muebles/diseno/${d.id}`}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Comprar con esta configuración
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      disabled={loadingId === d.id}
                      className="px-3 py-1.5 rounded-md border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {loadingId === d.id ? 'Eliminando...' : 'Eliminar diseño'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

