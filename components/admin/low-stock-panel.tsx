"use client";

import { useEffect, useState } from "react";

type Item = { id: string; name: string; sku?: string | null; stock: number };

export default function LowStockPanel({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/low-stock?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setThreshold(Number(data.threshold ?? null));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('inventory-refresh', handler);
    return () => window.removeEventListener('inventory-refresh', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="text-sm text-gray-600 mb-2">{threshold !== null ? `Bajo stock (≤ ${threshold})` : 'Bajo stock'}</div>
      {loading ? (
        <div className="text-sm text-gray-600">Cargando…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="border px-3 py-2">{p.name}</td>
                  <td className="border px-3 py-2 text-center">{p.sku || '—'}</td>
                  <td className="border px-3 py-2 text-center">{p.stock}</td>
                  <td className="border px-3 py-2 text-right">
                    <a className="text-blue-600 hover:underline" href={`/dashboard/admin/productos/${p.id}`}>Ajustar</a>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td className="px-3 py-2 text-sm text-gray-500" colSpan={4}>Sin alertas de bajo stock</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

