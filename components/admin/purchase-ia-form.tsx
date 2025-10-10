"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import PurchasePreviewTable, { type CompareItem } from "./purchase-preview-table";

type Supplier = { id: string; name: string };

export default function PurchaseIAForm({ suppliers, defaultTasa }: { suppliers: Supplier[]; defaultTasa: number }) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [currency, setCurrency] = useState<'USD'|'VES'>("USD");
  const [tasaVES, setTasaVES] = useState<number>(defaultTasa || 0);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CompareItem[] | null>(null);

  const canUpload = useMemo(() => !!file, [file]);

  const handleUpload = async () => {
    if (!file) { toast.error('Selecciona un PDF'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('currency', currency);
      if (currency === 'VES') fd.append('tasaVES', String(tasaVES || 0));
      const up = await fetch('/api/upload-invoice', { method: 'POST', body: fd, credentials: 'include' });
      const parsed = await up.json();
      if (!up.ok) throw new Error(parsed?.error || 'No se pudo leer el PDF');
      const compareRes = await fetch('/api/purchases/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currency: parsed.currency || currency, tasaVES: parsed.tasaVES || tasaVES, lines: parsed.lines || [] }) });
      const cmp = await compareRes.json();
      if (!compareRes.ok) throw new Error(cmp?.error || 'Error comparando productos');
      setItems(cmp.items || []);
      toast.success('Factura precargada');
    } catch (e: any) {
      toast.error(e?.message || 'Error en carga');
    } finally {
      setLoading(false);
    }
  };

  if (items) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-sm text-gray-600">Proveedor</div>
            <div>{suppliers.find(s => s.id === supplierId)?.name || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Moneda factura</div>
            <div>{currency}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tasa (VES→USD)</div>
            <div>{currency === 'VES' ? (tasaVES || 0).toFixed(2) : '—'}</div>
          </div>
        </div>
        <PurchasePreviewTable items={items} supplierId={supplierId || undefined} currency={currency} tasaVES={tasaVES} onCancel={() => setItems(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="form-label">Proveedor</label>
          <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Moneda de la factura</label>
          <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value as any)}>
            <option value="USD">USD</option>
            <option value="VES">Bs</option>
          </select>
        </div>
        <div>
          <label className="form-label">Tasa del día (VES→USD)</label>
          <input className="form-input" type="number" step={0.01} value={tasaVES} onChange={(e) => setTasaVES(parseFloat(e.target.value || '0'))} disabled={currency !== 'VES'} />
        </div>
      </div>

      <div>
        <label className="form-label">Factura en PDF</label>
        <input className="form-input" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <div>
        <button disabled={!canUpload || loading} onClick={handleUpload} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
          {loading ? 'Procesando…' : 'Subir y precargar'}
        </button>
      </div>
    </div>
  );
}

