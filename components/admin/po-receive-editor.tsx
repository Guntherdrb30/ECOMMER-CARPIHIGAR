"use client";

import { useEffect, useMemo, useState } from "react";

type POItem = { id: string; product: { name: string }; quantity: number; received: number };

export default function PoReceiveEditor({ items }: { items: POItem[] }) {
  const [rows, setRows] = useState<{ itemId: string; qty: number; pending: number; name: string }[]>(() => items.map(it => ({ itemId: it.id, qty: 0, pending: it.quantity - it.received, name: it.product?.name || '' })));

  const setQty = (id: string, qty: number) => setRows(prev => prev.map(r => r.itemId === id ? { ...r, qty: Math.max(0, Math.min(qty, r.pending)) } : r));

  const json = useMemo(() => JSON.stringify(rows.filter(r => r.qty > 0).map(r => ({ itemId: r.itemId, qty: r.qty }))), [rows]);

  useEffect(() => {
    // ensure we don't send empty array
  }, [json]);

  return (
    <div className="border rounded">
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 text-left">Producto</th>
            <th className="px-2 py-1">Pendiente</th>
            <th className="px-2 py-1">Recibir ahora</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.itemId}>
              <td className="border px-2 py-1">{r.name}</td>
              <td className="border px-2 py-1 text-center">{r.pending}</td>
              <td className="border px-2 py-1 text-center">
                <input type="number" min={0} max={r.pending} value={r.qty} onChange={(e) => setQty(r.itemId, parseInt(e.target.value || '0', 10))} className="w-24 border rounded px-1 py-0.5" />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="px-2 py-2 text-sm text-gray-500" colSpan={3}>No hay items en esta OC.</td></tr>
          )}
        </tbody>
      </table>
      <input type="hidden" name="items" value={json} />
    </div>
  );
}

