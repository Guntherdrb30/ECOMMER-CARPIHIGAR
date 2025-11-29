'use client';

import { useEffect, useState } from 'react';
import DimensionInputs from './DimensionInputs';
import AestheticSelector from './AestheticSelector';
import PriceBox from './PriceBox';
import {
  ProductSchemaType,
  type ProductConfig,
  createDefaultConfig,
} from '../lib/ProductSchema';
import {
  validateConfig,
  type FullValidationResult,
} from '../api/validate';
import { calculatePriceForConfig } from '../api/calculate';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

type ConfiguratorUIProps = {
  schema: ProductSchemaType;
  tasa: number;
  productId: string;
  productName: string;
  productImages?: string[];
  ecpdColors?: Array<{ name?: string; description?: string; image?: string }>;
};

export default function ConfiguratorUI({
  schema,
  tasa,
  productId,
  productName,
  productImages,
  ecpdColors,
}: ConfiguratorUIProps) {
  const [config, setConfig] = useState<ProductConfig>(() =>
    createDefaultConfig(schema),
  );
  const [validation, setValidation] = useState<FullValidationResult | null>(
    null,
  );
  const [price, setPrice] = useState<number>(() =>
    calculatePriceForConfig(createDefaultConfig(schema), schema),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [colorPreviewImage, setColorPreviewImage] = useState<string | null>(
    null,
  );

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const nextValidation = validateConfig(config, schema);
    setValidation(nextValidation);
    const nextPrice = calculatePriceForConfig(config, schema);
    setPrice(nextPrice);
  }, [config, schema]);

  const handleDimensionChange = (
    key: 'width' | 'depth' | 'height',
    value: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [key]: value },
    }));
  };

  const handleAestheticChange = (
    key: keyof ProductConfig['aesthetics'],
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      aesthetics: { ...prev.aesthetics, [key]: value },
    }));

    // Cuando se cambia el color, usamos la muestra de melamina
    // para mostrarla en grande en la imagen principal.
    if (key === 'colors' && Array.isArray(ecpdColors) && ecpdColors.length) {
      const normalized = value.trim().toLowerCase();
      // En combinaciones "Color A + Color B" usamos primero coincidencia exacta,
      // y si no existe, usamos el primer color como referencia.
      const baseName =
        normalized.split('+')[0]?.trim().toLowerCase() || normalized;

      const match =
        ecpdColors.find(
          (c) => (c.name || '').trim().toLowerCase() === normalized,
        ) ||
        ecpdColors.find(
          (c) => (c.name || '').trim().toLowerCase() === baseName,
        );

      setColorPreviewImage(match?.image || null);
      if (match?.image) {
        setLightboxImage(match.image);
      }
    }
  };

  const handleExportConfig = () => {
    const json = JSON.stringify(
      { product: productName || schema.name, config, price },
      null,
      2,
    );
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(json);
        toast.success('Configuración copiada al portapapeles.');
      }
    } catch {
      toast.error('No se pudo copiar la configuración.');
    }
  };

  const handleAddToCart = async () => {
    const currentValidation = validateConfig(config, schema);
    setValidation(currentValidation);
    if (!currentValidation.valid) {
      toast.error('Revisa la configuración antes de agregar al carrito.');
      return;
    }

    const finalPrice = calculatePriceForConfig(config, schema);
    setPrice(finalPrice);

    setIsAdding(true);
    try {
      addItem(
        {
          id: productId,
          name: productName,
          priceUSD: finalPrice,
          image: productImages?.[0],
          type: 'configurable',
          config,
        } as any,
        1,
      );

      const payload = {
        productId,
        type: 'configurable',
        config,
        price: finalPrice,
        previewImage: (productImages && productImages[0]) || null,
      };

      try {
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}

      toast.success('Configuración agregada al carrito.');
    } finally {
      setIsAdding(false);
    }
  };

  const images = Array.isArray(productImages) ? productImages : [];
  const mainImage =
    colorPreviewImage ||
    (images.length > 0
      ? images[Math.min(activeImageIndex, images.length - 1)]
      : undefined);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)] items-start">
      {/* Columna izquierda: imagen principal + galería + precio */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            className="h-64 md:h-80 lg:h-[420px] bg-gray-900 flex items-center justify-center relative cursor-pointer"
            onClick={() => {
              if (mainImage) setLightboxImage(mainImage);
            }}
          >
            {mainImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                id="producto-imagen-principal"
                src={mainImage}
                alt={productName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!mainImage && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Sin imagen disponible
              </div>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Galería del producto
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img + idx.toString()}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setLightboxImage(img);
                  }}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg border overflow-hidden ${
                    idx === activeImageIndex
                      ? 'border-brand ring-2 ring-brand/40'
                      : 'border-gray-200 hover:border-brand/60'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${productName} vista ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <PriceBox
          price={price}
          tasa={tasa}
          validation={validation}
          onAddToCart={handleAddToCart}
          onExportConfig={handleExportConfig}
          isAdding={isAdding}
          config={config}
        />
      </div>

      {/* Columna derecha: solo panel de configuración (medidas y color) */}
      <div className="form-card space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Medidas</h3>
          <DimensionInputs
            schema={schema.dimensions}
            values={config.dimensions}
            onChange={handleDimensionChange}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Color</h3>
          <AestheticSelector
            schema={schema.aesthetics}
            values={config.aesthetics}
            onChange={handleAestheticChange}
            ecpdColors={ecpdColors}
          />
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold"
            aria-label="Cerrar imagen ampliada"
          >
            ×
          </button>
          <div className="w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt={productName}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

