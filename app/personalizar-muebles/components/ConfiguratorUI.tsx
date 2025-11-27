"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun } from "lucide-react";
import DimensionInputs from "./DimensionInputs";
import AestheticSelector from "./AestheticSelector";
import PriceBox from "./PriceBox";
import {
  ProductSchemaType,
  type ProductConfig,
  createDefaultConfig,
} from "../lib/ProductSchema";
import {
  validateConfig,
  type FullValidationResult,
} from "../api/validate";
import { calculatePriceForConfig } from "../api/calculate";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const nextValidation = validateConfig(config, schema);
    setValidation(nextValidation);
    const nextPrice = calculatePriceForConfig(config, schema);
    setPrice(nextPrice);
  }, [config, schema]);

  const handleDimensionChange = (
    key: "width" | "depth" | "height",
    value: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [key]: value },
    }));
  };

  const handleAestheticChange = (
    key: keyof ProductConfig["aesthetics"],
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
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(json);
        toast.success("Configuración copiada al portapapeles.");
      }
    } catch {
      toast.error("No se pudo copiar la configuración.");
    }
  };

  const handleAddToCart = async () => {
    const currentValidation = validateConfig(config, schema);
    setValidation(currentValidation);
    if (!currentValidation.valid) {
      toast.error("Revisa la configuración antes de agregar al carrito.");
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
          type: "configurable",
          config,
        } as any,
        1,
      );

      const payload = {
        productId,
        type: "configurable",
        config,
        price: finalPrice,
        previewImage: (productImages && productImages[0]) || null,
      };

      try {
        await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {}

      toast.success("Configuración agregada al carrito.");
    } finally {
      setIsAdding(false);
    }
  };

  const images = Array.isArray(productImages) ? productImages : [];
  const mainImage =
    images.length > 0
      ? images[Math.min(activeImageIndex, images.length - 1)]
      : undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ecpdTheme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ecpdTheme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <div
      className={`grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start rounded-2xl p-4 ${
        isDark ? "bg-zinc-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="space-y-8">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-400/60 bg-white/10 text-xs text-gray-100 hover:bg-white/20"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-yellow-400" />
                <span>Modo claro</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-sky-500" />
                <span>Modo oscuro</span>
              </>
            )}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            className="h-64 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center relative cursor-pointer"
            onClick={() => {
              if (mainImage) setLightboxImage(mainImage);
            }}
          >
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
                Ajusta dimensiones y estética para crear un mueble a medida listo para producción.
              </p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {images.length > 0 && (
              <div>
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
                          ? "border-brand ring-2 ring-brand/40"
                          : "border-gray-200 hover:border-brand/60"
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
                Acabados estéticos
              </h3>
              <AestheticSelector
                schema={schema.aesthetics}
                values={config.aesthetics}
                onChange={handleAestheticChange}
                ecpdColors={ecpdColors}
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

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
          <div className="max-w-5xl max-h-[90vh] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt={productName}
              className="w-full h-full object-contain rounded-lg shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
