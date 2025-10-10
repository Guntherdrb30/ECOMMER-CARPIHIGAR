"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

export type CompareItem = {
  input: { code?: string | null; name: string; quantity: number; unitCost: number };
  code?: string | null;
  name: string;
  quantity: number;
  costUSD: number;
  marginClientPct: number;
  marginAllyPct: number;
  marginWholesalePct: number;
  priceClientUSD: number;
  priceAllyUSD: number;
  priceWholesaleUSD: number;
  product?: { id: string; name: string } | null;
  estadoIA: 'EXISTENTE' | 'NUEVO';
  accion: 'ACTUALIZAR' | 'CREAR';
};

export default function PurchasePreviewTable({
  items: initialItems,
  supplierId,
  currency,
  tasaVES,
  onCancel,
}: {
  items: CompareItem[];
  supplierId?: string;
  currency: 'USD' | 'VES';
  tasaVES?: number;
  onCancel?: () => void;
}) {
  const [rows, setRows] = useState<(CompareItem & { selected: boolean })[]>(() => initialItems.map(it => ({ ...it, selected: true })));

  const setField = (idx: number, patch: Partial<CompareItem>) => {
    setRows(prev => {
      const next = [...prev];
      const current = { ...next[idx], ...patch } as any;
      // Recalculate prices if margins or cost change
      const cost = Number(current.costUSD || 0);
      const mc = Number(current.marginClientPct || 0);
      const ma = Number(current.marginAllyPct || 0);
      const mw = Number(current.marginWholesalePct || 0);
      current.priceClientUSD = Number((cost * (1 + mc / 100)).toFixed(2));
      current.priceAllyUSD = Number((cost * (1 + ma / 100)).toFixed(2));
      current.priceWholesaleUSD = Number((cost * (1 + mw / 100)).toFixed(2));
      next[idx] = current;
      return next;
    });
  };

  const setSelected = (idx: number, v: boolean) => setRows(prev => { const next = [...prev]; (next[idx] as any).selected = v; return next; });

  const totals = useMemo(() => {
    const sel = rows.filter(r => r.selected);
    const qty = sel.reduce((a, r) => a + Number(r.quantity || 0), 0);
    const usd = sel.reduce((a, r) => a + Number(r.quantity || 0) * Number(r.costUSD || 0), 0);
    return { qty, usd };
  }, [rows]);

  const save = async (selectedOnly: boolean) => {
    const pick = rows.filter(r => (selectedOnly ? r.selected : true));
    if (!pick.length) { toast.error('No hay filas seleccionadas'); return; }
    const payload = {
      supplierId: supplierId || null,
      currency,
      tasaVES: tasaVES || 0,
      items: pick.map(r => ({
        productId: r.product?.id || null,
        code: r.code || null,
        name: r.name,
        quantity: Number(r.quantity || 0),
        costUSD: Number(r.costUSD || 0),
        marginClientPct: Number(r.marginClientPct || 0),
        marginAllyPct: Number(r.marginAllyPct || 0),
        marginWholesalePct: Number(r.marginWholesalePct || 0),
      })),
    };
    try {
      const res = await fetch('/api/purchases/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');
      toast.success('Compra guardada');
      window.location.href = '/dashboard/admin/compras?message=Compra%20guardada';
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar');
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border rounded">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1 text-left">Código / Nombre</th>
              <th className="px-2 py-1">Cantidad</th>
              <th className="px-2 py-1">Costo USD</th>
              <th className="px-2 py-1">% Cliente</th>
              <th className="px-2 py-1">% Aliado</th>
              <th className="px-2 py-1">% Mayorista</th>
              <th className="px-2 py-1">Precio Cliente</th>
              <th className="px-2 py-1">Precio Aliado</th>
              <th className="px-2 py-1">Precio Mayorista</th>
              <th className="px-2 py-1">Estado IA</th>
              <th className="px-2 py-1">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.code || r.name}-${idx}`}>
                <td className="border px-2 py-1 text-center">
                  <input type="checkbox" checked={r.selected} onChange={(e) => setSelected(idx, e.target.checked)} />
                </td>
                <td className="border px-2 py-1">
                  <div className="font-medium truncate" title={r.name}>{r.name}</div>
                  <div className="text-xs text-gray-500">{r.code || '—'}</div>
                </td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" min={1} value={r.quantity} onChange={(e) => setField(idx, { quantity: Math.max(1, parseInt(e.target.value || '1', 10)) })} className="w-20 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" min={0} step={0.01} value={r.costUSD} onChange={(e) => setField(idx, { costUSD: Math.max(0, parseFloat(e.target.value || '0')) })} className="w-24 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" min={0} step={0.01} value={r.marginClientPct} onChange={(e) => setField(idx, { marginClientPct: Math.max(0, parseFloat(e.target.value || '0')) })} className="w-20 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" min={0} step={0.01} value={r.marginAllyPct} onChange={(e) => setField(idx, { marginAllyPct: Math.max(0, parseFloat(e.target.value || '0')) })} className="w-20 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input type="number" min={0} step={0.01} value={r.marginWholesalePct} onChange={(e) => setField(idx, { marginWholesalePct: Math.max(0, parseFloat(e.target.value || '0')) })} className="w-20 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1 text-right">{r.priceClientUSD.toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{r.priceAllyUSD.toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{r.priceWholesaleUSD.toFixed(2)}</td>
                <td className="border px-2 py-1 text-center">{r.estadoIA}</td>
                <td className="border px-2 py-1 text-center">{r.accion}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-2 py-2 text-sm text-gray-500" colSpan={12}>No hay productos detectados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Seleccionados: {rows.filter(r => r.selected).length} | Cantidad total: {totals.qty} | Costo USD: ${totals.usd.toFixed(2)}</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => save(true)} className="bg-blue-600 text-white px-3 py-1 rounded">Guardar seleccionado</button>
          <button type="button" onClick={() => save(false)} className="bg-green-600 text-white px-3 py-1 rounded">Guardar todo</button>
          <button type="button" onClick={onCancel} className="border px-3 py-1 rounded">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

