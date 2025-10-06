"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { product: { id: string; name: string; sku?: string | null }; soldQty: number };

export default function TopSoldPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<{ days: number; limit: number; cat: string }>({ days: 30, limit: 10, cat: '' });

  const refresh = async () => {
    setLoading(true);
    try {
      const url = new URL(window.location.href);
      const days = Number(url.searchParams.get('days') || 30);
      const limit = Number(url.searchParams.get('top') || 10);
      const cat = url.searchParams.get('cat') || '';
      setParams({ days, limit, cat });
      const qs = new URLSearchParams();
      qs.set('days', String(days));
      qs.set('limit', String(limit));
      if (cat) qs.set('cat', cat);
      const res = await fetch(`/api/inventory/top-sold?${qs.toString()}`);
      if (res.ok) setRows(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('inventory-refresh', handler);
    return () => window.removeEventListener('inventory-refresh', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareText = useMemo(() => rows.map((x, i) => `${i + 1}. ${x.product.name} (${x.product.sku || '—'}): ${x.soldQty}`).join('\n'), [rows]);
  const qsBase = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('days', String(params.days));
    qs.set('limit', String(params.limit));
    if (params.cat) qs.set('cat', params.cat);
    return qs.toString();
  }, [params]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">Más vendidos (últimos {params.days} días)</h3>
        <div className="flex items-center gap-2 text-sm">
          <a className="border rounded px-2 py-0.5" href={`/dashboard/admin/inventario/print?tipo=top&${qsBase}`} target="_blank">Imprimir</a>
          <a className="border rounded px-2 py-0.5" href={`/api/reports/inventory?tipo=top&${qsBase}`} target="_blank">CSV</a>
          {rows.length > 0 && (
            <>
              <a className="border rounded px-2 py-0.5" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`} target="_blank">WhatsApp</a>
              <a className="border rounded px-2 py-0.5" href={`mailto:?subject=${encodeURIComponent('Más vendidos')}&body=${encodeURIComponent(shareText)}`}>Email</a>
            </>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Cargando…</div>
      ) : (
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100"><th className="px-2 py-1 text-left">Producto</th><th className="px-2 py-1">SKU</th><th className="px-2 py-1">Vendidos</th></tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.product.id}>
                <td className="border px-2 py-1">{x.product.name}</td>
                <td className="border px-2 py-1 text-center">{x.product.sku || '—'}</td>
                <td className="border px-2 py-1 text-center">{x.soldQty}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td className="px-2 py-2 text-gray-500 text-sm" colSpan={3}>Sin datos</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

