"use client";

import { useEffect, useMemo, useState } from "react";

type Prod = { id: string; name: string; sku: string | null; priceUSD: number };
type Row = { productId: string; name: string; sku: string | null; quantity: number; costUSD: number };

export default function PoItemsEditor() {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Prod[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setFound([]); return; }
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
        if (res.ok) setFound(await res.json());
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const add = (p: Prod) => {
    setRows((prev) => {
      const idx = prev.findIndex(r => r.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, sku: p.sku, quantity: 1, costUSD: Number(p.priceUSD) }];
    });
    setQ("");
    setFound([]);
  };

  const remove = (id: string) => setRows((prev) => prev.filter(r => r.productId !== id));
  const setQty = (id: string, qty: number) => setRows((prev) => prev.map(r => r.productId === id ? { ...r, quantity: Math.max(1, qty) } : r));
  const setCost = (id: string, cost: number) => setRows((prev) => prev.map(r => r.productId === id ? { ...r, costUSD: Math.max(0, cost) } : r));

  const json = useMemo(() => JSON.stringify(rows.map(r => ({ productId: r.productId, quantity: r.quantity, costUSD: r.costUSD }))), [rows]);
  const total = useMemo(() => rows.reduce((a, r) => a + r.quantity * r.costUSD, 0), [rows]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-700">Agregar productos</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o SKU" className="w-full border rounded px-2 py-1" />
        {found.length > 0 && (
          <div className="mt-1 border rounded bg-white divide-y max-h-64 overflow-auto">
            {found.map((p) => (
              <button key={p.id} type="button" className="w-full text-left px-2 py-1 hover:bg-gray-50 flex justify-between" onClick={() => add(p)}>
                <span>{p.name} <span className="text-gray-500">({p.sku || '—'})</span></span>
                <span className="text-gray-600">${Number(p.priceUSD).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Producto</th>
              <th className="px-2 py-1">SKU</th>
              <th className="px-2 py-1">Cantidad</th>
              <th className="px-2 py-1">Costo USD</th>
              <th className="px-2 py-1">Subtotal</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.productId}>
                <td className="border px-2 py-1">{r.name}</td>
                <td className="border px-2 py-1 text-center">{r.sku || '—'}</td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" min={1} value={r.quantity} onChange={(e) => setQty(r.productId, parseInt(e.target.value || '1', 10))} className="w-20 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" step="0.01" min={0} value={r.costUSD} onChange={(e) => setCost(r.productId, parseFloat(e.target.value || '0'))} className="w-24 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-right">{(r.quantity * r.costUSD).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right"><button type="button" onClick={() => remove(r.productId)} className="text-red-600 hover:underline">Quitar</button></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-2 py-2 text-sm text-gray-500" colSpan={6}>Agrega productos a la orden de compra.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">Items: {rows.length}</div>
        <div className="font-semibold">Total estimado: ${total.toFixed(2)}</div>
      </div>

      <input type="hidden" name="items" value={json} />
    </div>
  );
}

