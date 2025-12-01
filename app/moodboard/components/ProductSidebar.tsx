"use client";

import React, { useEffect, useState } from "react";
import { fetchMoodboardProducts } from "@/app/moodboard/lib/moodboardApi";
import type { ProductSummary, MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";

interface ProductSidebarProps {
  className?: string;
}

function createElementFromProduct(product: ProductSummary): MoodboardElement {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    type: "product",
    x: 80,
    y: 80,
    width: 240,
    height: 240,
    rotation: 0,
    opacity: 1,
    locked: false,
    data: {
      productId: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      backgroundColor: "#F3F4F6",
    },
  };
}

export default function ProductSidebar({ className }: ProductSidebarProps) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addElement = useMoodboardStore((s) => s.addElement);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchMoodboardProducts({
        q: q.trim() || undefined,
        category: category.trim() || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      setProducts(items);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside
      className={`flex h-full flex-col rounded-xl bg-white p-4 shadow-md border border-gray-200 ${className ?? ""}`}
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-800">Productos</h2>
      <div className="mb-3 space-y-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o código"
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categoría (texto opcional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Mín $"
            className="w-1/2 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Máx $"
            className="w-1/2 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadProducts()}
          className="mt-1 w-full rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
        >
          Filtrar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading && <p className="text-xs text-gray-500">Cargando productos...</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-xs text-gray-500">No se encontraron productos.</p>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            draggable
            onDragStart={(e) => {
              setIsDragging(true);
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ type: "product", product: p }),
              );
              e.dataTransfer.effectAllowed = "copy";
            }}
            onDragEnd={() => setIsDragging(false)}
            onClick={() => {
              if (isDragging) {
                setIsDragging(false);
                return;
              }
              const element = createElementFromProduct(p);
              addElement(element);
            }}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs hover:border-brand hover:bg-white"
          >
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800">
                {p.name}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {p.code || "Sin código"} · ${p.price.toFixed(2)}
              </p>
              {p.category && (
                <p className="truncate text-[11px] text-gray-400">
                  {p.category}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-gray-400">
        Haz clic en un producto para añadirlo, o arrástralo al lienzo para posicionarlo manualmente.
      </p>
    </aside>
  );
}

