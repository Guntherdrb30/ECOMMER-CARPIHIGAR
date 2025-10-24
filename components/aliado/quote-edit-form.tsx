"use client";

import { useEffect, useMemo, useState } from "react";

type Prod = { id: string; name: string; sku: string | null; priceUSD: number };
type Line = { productId: string; name: string; priceUSD: number; quantity: number };

export default function QuoteEditForm({ quoteId, ivaPercent, tasaVES, initialItems, initialNotes, initialTaxId, initialFiscalAddress, action, backTo }: {
  quoteId: string;
  ivaPercent: number;
  tasaVES: number;
  initialItems: Line[];
  initialNotes?: string | null;
  initialTaxId?: string | null;
  initialFiscalAddress?: string | null;
  action: (formData: FormData) => void;
  backTo: string;
}) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Prod[]>([]);
  const [items, setItems] = useState<Line[]>(() => initialItems || []);
  const [notes, setNotes] = useState<string>(initialNotes || "");
  const [customerTaxId, setCustomerTaxId] = useState<string>(initialTaxId || "");
  const [customerFiscalAddress, setCustomerFiscalAddress] = useState<string>(initialFiscalAddress || "");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setFound([]); return; }
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
        if (res.ok) setFound(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((a, it) => a + it.priceUSD * it.quantity, 0);
    const iva = subtotal * (Number(ivaPercent) / 100);
    const totalUSD = subtotal + iva;
    const totalVES = totalUSD * Number(tasaVES);
    return { subtotal, iva, totalUSD, totalVES };
  }, [items, ivaPercent, tasaVES]);

  const addItem = (p: Prod) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }; return next; }
      return [...prev, { productId: p.id, name: p.name, priceUSD: Number(p.priceUSD), quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => setItems((prev) => prev.map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, qty) } : l)));
  const remove = (id: string) => setItems((prev) => prev.filter((l) => l.productId !== id));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setError("");
    if (!items.length) { e.preventDefault(); setError('Debes agregar al menos un producto.'); return; }
    setLoading(true);
  };

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-700">Buscar productos</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, SKU o código" className="border rounded px-2 py-1 w-full" />
        {found.length > 0 && (
          <div className="mt-2 border rounded">
            {found.map((p) => (
              <button type="button" key={p.id} onClick={() => addItem(p)} className="flex justify-between w-full px-3 py-2 border-b hover:bg-gray-50">
                <span>{p.name} <span className="text-gray-500">({p.sku || '-'})</span></span>
                <span className="text-gray-700">${Number(p.priceUSD).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded border">
        <h3 className="font-semibold mb-2">Items del presupuesto</h3>
        {items.length === 0 && <div className="text-sm text-gray-500">Sin items aún</div>}
        {items.length > 0 && (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Producto</th>
                <th className="px-2 py-1 text-right">Precio</th>
                <th className="px-2 py-1 text-right">Cant.</th>
                <th className="px-2 py-1 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.productId}>
                  <td className="border px-2 py-1">{l.name}</td>
                  <td className="border px-2 py-1 text-right">${l.priceUSD.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">
                    <input type="number" min={1} value={l.quantity} onChange={(e) => updateQty(l.productId, parseInt(e.target.value || '1', 10))} className="w-20 border rounded px-2 py-1 text-right" />
                  </td>
                  <td className="border px-2 py-1 text-right">${(l.priceUSD * l.quantity).toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right"><button type="button" onClick={() => remove(l.productId)} className="text-red-600">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <input type="hidden" name="items" value={JSON.stringify(items)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div className="text-sm text-gray-600">IVA: {Number(ivaPercent).toFixed(2)}% • Tasa: {Number(tasaVES).toFixed(2)}</div>
        <div className="md:col-span-2 text-right">
          <div>Subtotal: ${totals.subtotal.toFixed(2)}</div>
          <div>IVA: ${totals.iva.toFixed(2)}</div>
          <div className="font-semibold">Total: ${totals.totalUSD.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-700">Cédula / RIF</label>
          <input name="customerTaxId" value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="V-12345678 / J-12345678-9" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">Dirección fiscal</label>
          <textarea name="customerFiscalAddress" value={customerFiscalAddress} onChange={(e) => setCustomerFiscalAddress(e.target.value)} className="border rounded px-2 py-1 w-full min-h-[60px]" placeholder="Calle, edificio, piso, municipio, estado" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700">Notas</label>
        <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Notas para el cliente (opcional)" />
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div>
        <button disabled={loading || !items.length} className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50">Guardar Cambios</button>
      </div>
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="ivaPercent" value={String(ivaPercent)} />
      <input type="hidden" name="tasaVES" value={String(tasaVES)} />
      <input type="hidden" name="backTo" value={backTo} />
    </form>
  );
}

