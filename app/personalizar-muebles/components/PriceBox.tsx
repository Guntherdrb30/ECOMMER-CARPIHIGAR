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
    <aside className="bg-white rounded-xl shadow-lg p-6 space-y-6 sticky top-24">
      <div>
        <h2 className="text-xl font-bold mb-2">Precio estimado</h2>
        <div
          className={`text-3xl font-extrabold text-brand transition-transform ${
            highlight ? 'scale-110' : 'scale-100'
          }`}
        >
          <Price priceUSD={price} tasa={tasa} moneda="USD" />
        </div>
        <div className="mt-1 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Precio dinámico según medidas y acabados.
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Tu configuración
        </h3>
        <div className="text-xs text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3 max-h-48 overflow-auto">
          <div>
            <span className="font-semibold">Dimensiones:</span>{' '}
            {config.dimensions.width} × {config.dimensions.depth} ×{' '}
            {config.dimensions.height} cm
          </div>
          <div>
            <span className="font-semibold">Componentes:</span>{' '}
            {config.components.shelves} baldas, {config.components.drawers}{' '}
            cajones, maletero {config.components.maletero} cm, barra de colgar{' '}
            {config.components.hangingBar ? 'sí' : 'no'}
            {config.components.rodapieAMedida
              ? `, rodapié a medida ${config.components.rodapieAMedidaDimension ?? ''} cm`
              : ', sin rodapié a medida'}
          </div>
          <div>
            <span className="font-semibold">Estética:</span>{' '}
            {config.aesthetics.doors} puerta(s), color {config.aesthetics.colors}
            , tirador {config.aesthetics.handles}
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
          <div className="font-semibold">Revisa estos puntos antes de continuar:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => onAddToCart()}
        disabled={isAdding || hasErrors}
        className="w-full bg-brand text-white font-bold py-3 rounded-full hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {hasErrors ? 'Corrige la configuración' : isAdding ? 'Agregando...' : 'Agregar al carrito'}
      </button>
    </aside>
  );
}

