"use client";

import { useEffect, useState } from "react";
import { useAssistant } from "./hooks/useAssistant";

type CartItem = {
  productId: string;
  name?: string;
  quantity: number;
  priceUSD?: number;
  image?: string;
};

export default function CartView() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const { setView, continuePurchase } = useAssistant();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/ui-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view_cart" }),
      });
      const json = await res.json();
      setItems(Array.isArray(json?.data?.items) ? json.data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId: string) => {
    await fetch("/api/assistant/ui-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_from_cart", payload: { productId } }),
    });
    load();
  };

  const update = async (productId: string, quantity: number) => {
    await fetch("/api/assistant/ui-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_qty", payload: { productId, quantity } }),
    });
    load();
  };

  const subtotal = items.reduce(
    (s, it) => s + Number(it.priceUSD || 0) * Number(it.quantity || 0),
    0,
  );

  const onBackToSearch = () => {
    setView("chat");
  };

  const onCheckout = async () => {
    await continuePurchase("start");
  };

  return (
    <div className="p-3">
      <div className="font-semibold text-gray-900 mb-2">Tu carrito</div>
      {loading ? (
        <div className="text-sm text-gray-600">Cargando…</div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-sm text-gray-600">
              No hay productos en el carrito.
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.productId}
              className="flex items-center gap-2 border rounded p-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">
                  {it.name || it.productId}
                </div>
                <div className="text-xs text-gray-600">
                  ${Number(it.priceUSD || 0).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    update(
                      it.productId,
                      parseInt(e.target.value || "1", 10),
                    )
                  }
                  className="w-16 border rounded px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => remove(it.productId)}
                  className="text-xs px-2 py-1 rounded border text-gray-800 hover:bg-gray-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">Subtotal</div>
            <div className="font-semibold">${subtotal.toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBackToSearch}
              className="flex-1 text-sm px-3 py-2 rounded border text-gray-800 hover:bg-gray-50"
            >
              Volver a buscar
            </button>
            <button
              type="button"
              onClick={onCheckout}
              className="flex-1 text-sm px-3 py-2 rounded bg-[#E62C1A] text-white hover:scale-105 transition-transform"
            >
              Proceder al pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

