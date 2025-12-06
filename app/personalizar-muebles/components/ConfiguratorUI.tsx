'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

type OverlayState = {
  x: number; // 0-1 horizontal (centro)
  y: number; // 0-1 vertical (centro)
  scale: number;
  rotation: number; // rotación frontal (eje Z)
  tiltX: number; // inclinación adelante / atrás (eje X)
  tiltY: number; // inclinación izquierda / derecha (eje Y)
};

type ConfiguratorUIProps = {
  schema: ProductSchemaType;
  tasa: number;
  productId: string;
  productName: string;
  productImages?: string[];
  ecpdColors?: Array<{ name?: string; description?: string; image?: string }>;
  whatsappPhone?: string;
  productSku?: string | null;
  initialConfig?: ProductConfig | null;
  initialSpaceImageUrl?: string | null;
  initialOverlay?: OverlayState | null;
  canSaveDesign?: boolean;
};

export default function ConfiguratorUI({
  schema,
  tasa,
  productId,
  productName,
  productImages,
  ecpdColors,
  whatsappPhone,
  productSku,
  initialConfig,
  initialSpaceImageUrl,
  initialOverlay,
  canSaveDesign = false,
}: ConfiguratorUIProps) {
  const [config, setConfig] = useState<ProductConfig>(() =>
    initialConfig ? initialConfig : createDefaultConfig(schema),
  );
  const [validation, setValidation] = useState<FullValidationResult | null>(
    null,
  );
  const [price, setPrice] = useState<number>(() =>
    calculatePriceForConfig(
      initialConfig ? initialConfig : createDefaultConfig(schema),
      schema,
    ),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [colorPreviewImage, setColorPreviewImage] = useState<string | null>(
    null,
  );

  const [spaceImageUrl, setSpaceImageUrl] = useState<string | null>(
    initialSpaceImageUrl || null,
  );
  const [spaceUploading, setSpaceUploading] = useState(false);
  const [spaceUploadError, setSpaceUploadError] = useState<string | null>(null);

  const [overlay, setOverlay] = useState<OverlayState>(
    initialOverlay || {
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
    },
  );
  const [isFullscreenEditorOpen, setIsFullscreenEditorOpen] = useState(false);

  const spaceContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

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
      // En combinaciones "Color A + Color B" usamos primero coincidencia exacta
      // y, si no existe, usamos el primer color como referencia.
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
      } catch {
        // Silenciar errores del carrito paralelo
      }

      toast.success('Configuración agregada al carrito.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSpaceImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSpaceUploadError(null);
    setSpaceUploading(true);
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
      toast.success('Imagen de tu espacio cargada.');
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string'
          ? err.message
          : 'No se pudo subir la imagen.';
      setSpaceUploadError(msg);
      toast.error(msg);
    } finally {
      setSpaceUploading(false);
      // Permitir volver a subir el mismo archivo si hace falta
      e.target.value = '';
    }
  };

  const runDownloadCapture = useCallback(async (): Promise<string | null> => {
    if (!spaceContainerRef.current) return null;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(spaceContainerRef.current, {
        useCORS: true,
        backgroundColor: null,
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error capturando diseño ECPD:', err);
      return null;
    }
  }, []);

  const handleDownloadDesignImage = async () => {
    if (!spaceImageUrl) {
      toast.error('Primero sube la foto de tu espacio.');
      return;
    }
    const dataUrl = await runDownloadCapture();
    if (!dataUrl) {
      toast.error(
        'No se pudo generar la imagen del diseño. Intenta de nuevo o usa una captura de pantalla.',
      );
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${productName || 'diseno-mueble'}-carpihogar.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('No se pudo descargar la imagen del diseño.');
    }
  };

  const handleSaveDesign = async () => {
    if (!canSaveDesign) {
      toast.error('Debes iniciar sesión para guardar tu diseño.');
      return;
    }
    if (!spaceImageUrl) {
      toast.error('Primero sube la foto de tu espacio.');
      return;
    }
    const currentValidation = validateConfig(config, schema);
    if (!currentValidation.valid) {
      setValidation(currentValidation);
      toast.error('Revisa la configuración antes de guardar el diseño.');
      return;
    }

    try {
      const payload = {
        productId,
        spaceImageUrl,
        config,
        overlay,
        priceUSD: price,
      };
      const res = await fetch('/api/ecpd-designs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json: any = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          json?.message ||
          json?.error ||
          'No se pudo guardar el diseño personalizado.';
        toast.error(String(msg));
        return;
      }
      toast.success('Diseño personalizado guardado en tu cuenta.');
    } catch (err: any) {
      const msg =
        typeof err?.message === 'string'
          ? err.message
          : 'No se pudo guardar el diseño personalizado.';
      toast.error(msg);
    }
  };

  const handleOverlayPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    const container = spaceContainerRef.current;
    if (container && typeof (container as any).setPointerCapture === 'function') {
      try {
        (container as any).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const container = spaceContainerRef.current;
    if (
      container &&
      typeof (container as any).releasePointerCapture === 'function'
    ) {
      try {
        (container as any).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const container = spaceContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const clampedX = Math.min(1, Math.max(0, x));
    const clampedY = Math.min(1, Math.max(0, y));
    setOverlay((prev) => ({
      ...prev,
      x: clampedX,
      y: clampedY,
    }));
  };

  const images = Array.isArray(productImages) ? productImages : [];
  const mainImage =
    colorPreviewImage ||
    (images.length > 0
      ? images[Math.min(activeImageIndex, images.length - 1)]
      : undefined);

  const baseWidth =
    (schema as any).initialDimensions?.width ?? schema.dimensions.width.min;
  const dimensionScale =
    baseWidth > 0 ? config.dimensions.width / baseWidth : 1;
  const visualScale = Math.max(
    0.25,
    Math.min(4, dimensionScale * overlay.scale),
  );

  const SpaceEditorCard = ({ fullscreen = false }: { fullscreen?: boolean }) => {
    const containerHeightClasses = fullscreen
      ? 'h-[60vh] md:h-[65vh] lg:h-[70vh]'
      : 'h-64 md:h-80 lg:h-[380px]';

    return (
      <div
        className={`bg-white rounded-xl shadow-lg overflow-hidden ${
          fullscreen ? 'max-w-5xl mx-auto h-full flex flex-col' : ''
        }`}
      >
        <div className={`p-4 space-y-4 ${fullscreen ? 'flex-1 flex flex-col' : ''}`}>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              1. Sube la imagen de tu espacio
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSpaceImageChange}
                className="text-xs"
              />
              {spaceUploading && (
                <span className="text-xs text-gray-500">Subiendo imagen...</span>
              )}
              {spaceImageUrl && !spaceUploading && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  Imagen cargada
                </span>
              )}
            </div>
            {spaceUploadError && (
              <p className="text-xs text-red-600">{spaceUploadError}</p>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
                2. Coloca el mueble en tu espacio
              </p>
              {!fullscreen && (
                <button
                  type="button"
                  onClick={() => setIsFullscreenEditorOpen(true)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Pantalla completa
                </button>
              )}
            </div>

            <div
              ref={spaceContainerRef}
              className={`relative bg-gray-900 rounded-lg overflow-hidden cursor-move ${containerHeightClasses}`}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={handleOverlayPointerUp}
              onPointerLeave={handleOverlayPointerUp}
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {spaceImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spaceImageUrl}
                  alt="Tu espacio"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainImage}
                  alt={productName}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm px-4 text-center">
                  Sube una foto de tu espacio para ver el mueble en contexto.
                </div>
              )}

              {mainImage && (
                <div
                  role="button"
                  aria-label="Mueble en tu espacio"
                  onPointerDown={handleOverlayPointerDown}
                  className="absolute"
                  style={{
                    left: `${overlay.x * 100}%`,
                    top: `${overlay.y * 100}%`,
                    transform: `translate(-50%, -50%) rotateX(${overlay.tiltX}deg) rotateY(${overlay.tiltY}deg) rotateZ(${overlay.rotation}deg) scale(${visualScale})`,
                    transformOrigin: 'center center',
                    touchAction: 'none',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    id="producto-imagen-principal"
                    src={mainImage}
                    alt={productName}
                    className="max-w-[55vw] md:max-w-[40vw] lg:max-w-[32vw] h-auto drop-shadow-2xl"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Escala visual
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={overlay.scale}
                  onChange={(e) =>
                    setOverlay((prev) => ({
                      ...prev,
                      scale: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Rotación frontal
                </label>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={overlay.rotation}
                  onChange={(e) =>
                    setOverlay((prev) => ({
                      ...prev,
                      rotation: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="block text-[11px] font-medium text-gray-600 mb-1">
                  Posición rápida
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOverlay((prev) => ({ ...prev, x: 0.5, y: 0.5 }))
                    }
                    className="px-2 py-1 rounded border text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Centrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlay((prev) => ({ ...prev, y: 0.8 }))}
                    className="px-2 py-1 rounded border text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Piso
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOverlay((prev) => ({ ...prev, x: 0.25 }))
                    }
                    className="px-2 py-1 rounded border text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Izquierda
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOverlay((prev) => ({ ...prev, x: 0.75 }))
                    }
                    className="px-2 py-1 rounded border text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Derecha
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Profundidad (inclinación)
                </label>
                <input
                  type="range"
                  min={-25}
                  max={25}
                  step={1}
                  value={overlay.tiltX}
                  onChange={(e) =>
                    setOverlay((prev) => ({
                      ...prev,
                      tiltX: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                  Ángulo lateral
                </label>
                <input
                  type="range"
                  min={-25}
                  max={25}
                  step={1}
                  value={overlay.tiltY}
                  onChange={(e) =>
                    setOverlay((prev) => ({
                      ...prev,
                      tiltY: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDesign}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-40"
                disabled={!canSaveDesign}
              >
                Guardar diseño
              </button>
              <button
                type="button"
                onClick={handleDownloadDesignImage}
                className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Descargar imagen del diseño
              </button>
            </div>

            <div className="mt-3 border-t pt-3">
              <div className="text-xs text-gray-700 space-y-1">
                <div className="font-semibold">
                  Mueble seleccionado:{' '}
                  <span className="font-normal">{productName}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {productSku && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                      Código: {productSku}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                    Medidas:{' '}
                    <span className="ml-1 font-medium">
                      {config.dimensions.width} cm (ancho) ·{' '}
                      {config.dimensions.height} cm (alto) ·{' '}
                      {config.dimensions.depth} cm (fondo)
                    </span>
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                    Color:{' '}
                    <span className="ml-1 font-medium">
                      {config.aesthetics.colors}
                    </span>
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  Precio actual:{' '}
                  <span className="text-brand">${price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)] items-start">
        {/* Columna izquierda: foto del espacio + mueble superpuesto + galería */}
        <div className="space-y-4">
          <SpaceEditorCard />

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
        </div>

        {/* Columna derecha: precio + panel de configuración (medidas y color) */}
        <div className="space-y-6">
          <PriceBox
            price={price}
            tasa={tasa}
            validation={validation}
            onAddToCart={handleAddToCart}
            onExportConfig={handleExportConfig}
            isAdding={isAdding}
            config={config}
            productName={productName}
            whatsappPhone={whatsappPhone}
          />

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

      {isFullscreenEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm font-semibold">
              Editar diseño en tu espacio
            </p>
            <button
              type="button"
              onClick={() => setIsFullscreenEditorOpen(false)}
              className="inline-flex items-center rounded-md border border-white/60 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
            >
              Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <SpaceEditorCard fullscreen />
          </div>
        </div>
      )}
    </>
  );
}

