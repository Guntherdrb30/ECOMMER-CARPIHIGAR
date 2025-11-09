"use client";
import React, { useMemo } from "react";
import { useCartStore } from "@/store/cart";

export default function CartView({ onRelated }: { onRelated?: () => void }) {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalUSD = useMemo(() => items.reduce((a, b) => a + (b.priceUSD || 0) * b.quantity, 0), [items]);
  return (
    <div className="p-2 border rounded-lg bg-white">
      <div className="font-medium mb-2">Tu carrito</div>
      <div className="space-y-2 max-h-64 overflow-auto atlas-scrollbar">
        {items.length === 0 ? (
          <div className="text-sm text-gray-600">Aún no has agregado productos.</div>
        ) : items.map((it) => (
          <div key={it.id} className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {it.image ? <img src={it.image} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm">{it.name}</div>
              <div className="text-xs text-gray-600">${(it.priceUSD || 0).toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 border rounded text-xs" onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1))}>-</button>
              <span className="text-sm w-6 text-center">{it.quantity}</span>
              <button className="px-2 py-1 border rounded text-xs" onClick={() => updateQty(it.id, it.quantity + 1)}>+</button>
            </div>
            <button className="px-2 py-1 border rounded text-xs" onClick={() => removeItem(it.id)}>Eliminar</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <div>Total</div>
        <div className="font-semibold">${totalUSD.toFixed(2)}</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <a href="/checkout/revisar" className="flex-1 text-center atlas-button rounded py-2">Proceder a pagar</a>
        <button className="px-3 py-2 border rounded text-sm" onClick={onRelated}>Ver relacionados</button>
      </div>
    </div>
  );
}

