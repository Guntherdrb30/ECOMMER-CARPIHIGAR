'use client';

import { useState } from 'react';

export default function StockHistory({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-movements/${productId}?take=50`, { cache: 'no-store' });
      const json = await res.json();
      setItems(json.items || []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="px-2 py-1 rounded border" onClick={load} disabled={loading}>
        {loading ? 'Cargando...' : 'Historial'}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow max-w-xl w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Historial de stock</h3>
              <button className="text-gray-600" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-2 py-1">Fecha</th>
                    <th className="text-left px-2 py-1">Tipo</th>
                    <th className="text-right px-2 py-1">Cantidad</th>
                    <th className="text-left px-2 py-1">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="px-2 py-1">{new Date(m.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-1">{m.type}</td>
                      <td className="px-2 py-1 text-right">{m.quantity}</td>
                      <td className="px-2 py-1">{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

