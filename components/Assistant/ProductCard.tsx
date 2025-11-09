"use client";
import React from "react";
import { useCartStore } from "@/store/cart";

type Product = { id: string; name: string; slug: string; images?: string[]; priceUSD?: number };

export default function ProductCard({ p, onAdd }: { p: Product; onAdd?: (p: Product) => void }) {
  const addItem = useCartStore((s) => s.addItem);
  const img = (p.images && p.images[0]) || '';
  const price = typeof p.priceUSD === 'number' ? p.priceUSD : undefined;
  const addToCart = () => {
    try { addItem({ id: p.id, name: p.name, priceUSD: price || 0, image: img, sku: p.slug }, 1); } catch {}
    onAdd?.(p);
  };
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
      <div className="h-14 w-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {img ? (<img src={img} alt={p.name} className="w-full h-full object-cover" />) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{p.name}</div>
        {typeof price === 'number' && (
          <div className="text-xs text-gray-600">${price.toFixed(2)}</div>
        )}
      </div>
      <button className="px-3 py-1 rounded atlas-button text-sm" onClick={addToCart}>Agregar</button>
    </div>
  );
}

