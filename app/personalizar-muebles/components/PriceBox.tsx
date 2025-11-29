'use client';

import { useEffect, useState } from 'react';
import type { FullValidationResult } from '../api/validate';
import type { ProductConfig } from '../lib/ProductSchema';
import Price from '@/components/price';

type PriceBoxProps = {
  price: number;
  tasa: number;
  validation: FullValidationResult | null;
  onAddToCart: () => Promise<void> | void;
  onExportConfig: () => void;
  isAdding: boolean;
  config: ProductConfig;
};

export default function PriceBox({
  price,
  tasa,
  validation,
  onAddToCart,
  onExportConfig,
  isAdding,
  config,
}: PriceBoxProps) {
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    setHighlight(true);
    const t = setTimeout(() => setHighlight(false), 350);
    return () => clearTimeout(t);
  }, [price]);

  const hasErrors = !!validation && !validation.valid;
  const errors = validation?.errors ?? [];

  return (
    <aside className="bg-white rounded-xl shadow-lg p-4 md:p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-1">Precio estimado</h2>
        <div
          className={`text-2xl md:text-3xl font-extrabold text-brand transition-transform ${
            highlight ? 'scale-110' : 'scale-100'
          }`}
        >
          <Price priceUSD={price} tasa={tasa} moneda="USD" />
        </div>
        <div className="mt-1 text-xs md:text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Precio dinámico según las medidas configuradas.
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Tu configuración
        </h3>
        <div className="text-xs text-gray-700 space-y-1 bg-gray-50 rounded-lg p-2.5 max-h-28 overflow-auto">
          <div>
            <span className="font-semibold">Dimensiones:</span>{' '}
            {config.dimensions.width} × {config.dimensions.depth} ×{' '}
            {config.dimensions.height} cm
          </div>
          <div>
            <span className="font-semibold">Color:</span>{' '}
            {config.aesthetics.colors}
          </div>
        </div>
        <button
          type="button"
          onClick={onExportConfig}
          className="mt-3 w-full text-xs font-medium text-brand border border-brand rounded-full py-2 hover:bg-brand hover:text-white transition-colors"
        >
          Exportar configuración
        </button>
      </div>

      {hasErrors && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg p-3 space-y-1">
          <div className="font-semibold">
            Revisa estos puntos antes de continuar:
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((err, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => onAddToCart()}
        disabled={isAdding || hasErrors}
        className="w-full bg-brand text-white font-bold py-2.5 rounded-full hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {hasErrors
          ? 'Corrige la configuración'
          : isAdding
            ? 'Agregando...'
            : 'Agregar al carrito'}
      </button>
    </aside>
  );
}
