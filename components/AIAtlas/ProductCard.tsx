"use client";

import { useState } from 'react';
import { track } from "@vercel/analytics/react";

type Product = { id: string; name: string; images?: string[]; priceUSD?: number };

export default function ProductCard({ product, onAdded }: { product: Product; onAdded?: () => void }) {
  const [loading, setLoading] = useState(false);
  const img = product.images && product.images.length ? product.images[0] : '/images/placeholder.png';
  const add = async () => {
    try {
      setLoading(true);
      await fetch('/api/assistant/ui-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_to_cart', payload: { productId: product.id, quantity: 1 } }),
      });
      try {
        track('assistant_add_to_cart', {
          source: 'aiatlas',
          product_id: product.id,
        });
      } catch {}
      onAdded?.();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="border rounded-lg p-2 w-full flex gap-2">
      <img src={img} alt={product.name} className="w-16 h-16 object-cover rounded" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">{product.name}</div>
        {product.priceUSD != null && (<div className="text-xs text-gray-600">${Number(product.priceUSD).toFixed(2)}</div>)}
        <div className="mt-2">
          <button onClick={add} disabled={loading} className="text-xs px-2 py-1 rounded bg-[#E62C1A] text-white hover:scale-105 transition-transform disabled:opacity-50">{loading ? 'Agregando…' : 'Agregar al carrito'}</button>
        </div>
      </div>
    </div>
  );
}

