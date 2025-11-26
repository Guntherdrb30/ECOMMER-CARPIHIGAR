'use client';

import { useEffect, useState } from 'react';
import DimensionInputs from './DimensionInputs';
import ComponentSelector from './ComponentSelector';
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
};

export default function ConfiguratorUI({
  schema,
  tasa,
  productId,
  productName,
  productImages,
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

  const handleComponentChange = (
    key: keyof ProductConfig['components'],
    value: number | boolean,
  ) => {
    setConfig((prev) => ({
      ...prev,
      components: { ...prev.components, [key]: value as any },
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

  const mainImage = productImages && productImages[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center relative">
            {mainImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={productName}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative text-center text-white px-6">
              <div className="text-xs uppercase tracking-[0.25em] text-gray-300 mb-2">
                Motor de configuración Carpihogar
              </div>
              <h2 className="text-3xl font-extrabold mb-2">
                {productName || schema.name}
              </h2>
              <p className="text-sm text-gray-200 max-w-md mx-auto">
                Ajusta dimensiones, componentes y estética para crear un mueble a medida listo para producción.
              </p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Dimensiones del mueble
              </h3>
              <DimensionInputs
                schema={schema.dimensions}
                values={config.dimensions}
                onChange={handleDimensionChange}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Componentes internos
              </h3>
              <ComponentSelector
                schema={schema.components}
                values={config.components}
                onChange={handleComponentChange}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Acabados estéticos
              </h3>
              <AestheticSelector
                schema={schema.aesthetics}
                values={config.aesthetics}
                onChange={handleAestheticChange}
              />
            </div>
          </div>
        </div>
      </div>

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
  );
}

