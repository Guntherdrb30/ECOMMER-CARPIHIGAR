"use client";

import { useEffect, useState } from "react";

export default function TopSupplierKPI({ detailHref = "/dashboard/admin/inventario/valuacion/por-proveedor" }: { detailHref?: string }) {
  const [supplier, setSupplier] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchTop = async () => {
    try {
      setLoading(true);
      const url = new URL(window.location.href);
      const cat = url.searchParams.get('cat') || '';
      const qs = new URLSearchParams();
      if (cat) qs.set('cat', cat);
      qs.set('limit', '1');
      const res = await fetch(`/api/inventory/top-suppliers?${qs.toString()}`);
      if (res.ok) {
        const j = await res.json();
        setSupplier(j.supplier);
        setTotal(Number(j.totalValueUSD || 0));
      }
    } catch {
      // ignore errors in KPI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600">Top proveedor</div>
      <div className="text-base font-semibold truncate">{supplier || '—'}</div>
      <div className="text-sm text-gray-700">{loading ? 'Cargando…' : `$${total.toFixed(2)}`}</div>
      <div className="mt-2 flex items-center gap-2">
        <a className="text-blue-600 text-sm hover:underline" href={detailHref}>Ver detalle</a>
        <button type="button" onClick={fetchTop} className="text-sm px-2 py-0.5 border rounded">Actualizar KPI</button>
      </div>
    </div>
  );
}
