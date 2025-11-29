'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FullValidationResult } from '../api/validate';
import type { ProductConfig } from '../lib/ProductSchema';
import Price from '@/components/price';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
} from 'react-share';

type PriceBoxProps = {
  price: number;
  tasa: number;
  validation: FullValidationResult | null;
  onAddToCart: () => Promise<void> | void;
  onExportConfig: () => void;
  isAdding: boolean;
  config: ProductConfig;
  productName: string;
  whatsappPhone?: string;
};

export default function PriceBox({
  price,
  tasa,
  validation,
  onAddToCart,
  onExportConfig,
  isAdding,
  config,
  productName,
  whatsappPhone,
}: PriceBoxProps) {
  const [highlight, setHighlight] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    setHighlight(true);
    const t = setTimeout(() => setHighlight(false), 350);
    return () => clearTimeout(t);
  }, [price]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const hasErrors = !!validation && !validation.valid;
  const errors = validation?.errors ?? [];

  const whatsappNumber = useMemo(() => {
    if (!whatsappPhone) return null;
    const raw = whatsappPhone.replace(/\D+/g, '');
    return raw || null;
  }, [whatsappPhone]);

  const dims = config.dimensions;
  const color = config.aesthetics.colors;
  const priceLabel = `${price.toFixed(2)} USD`;

  const shareTitle = `Configuración de "${productName}" – ${priceLabel}. Dimensiones: ${dims.width}×${dims.depth}×${dims.height} cm. Color: ${color}.`;

  const handleWhatsAppContact = () => {
    if (!whatsappNumber || typeof window === 'undefined') return;
    const urlText = shareUrl ? `\nLink: ${shareUrl}` : '';
    const text = `Hola, estoy interesado en este mueble personalizado "${productName}".\n\nConfiguración actual:\n- Dimensiones: ${dims.width} × ${dims.depth} × ${dims.height} cm\n- Color: ${color}\n- Precio estimado: ${priceLabel}${urlText}`;
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      text,
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

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
            {dims.width} × {dims.depth} × {dims.height} cm
          </div>
          <div>
            <span className="font-semibold">Color:</span> {color}
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

      {whatsappNumber && (
        <button
          type="button"
          onClick={handleWhatsAppContact}
          className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-sm py-2.5 rounded-full transition-colors"
        >
          Consultar esta configuración por WhatsApp
        </button>
      )}

      {shareUrl && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2 text-center">
            Compartir esta configuración
          </p>
          <div className="flex justify-center gap-3">
            <FacebookShareButton url={shareUrl} quote={shareTitle}>
              <FacebookIcon size={32} round />
            </FacebookShareButton>
            <TwitterShareButton url={shareUrl} title={shareTitle}>
              <TwitterIcon size={32} round />
            </TwitterShareButton>
            <WhatsappShareButton url={shareUrl} title={shareTitle} separator=" - ">
              <WhatsappIcon size={32} round />
            </WhatsappShareButton>
            <TelegramShareButton url={shareUrl} title={shareTitle}>
              <TelegramIcon size={32} round />
            </TelegramShareButton>
          </div>
        </div>
      )}
    </aside>
  );
}
