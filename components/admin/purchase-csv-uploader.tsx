"use client";

import { useEffect, useMemo, useState } from 'react';

type Supplier = { id: string; name: string };
type PreviewItem = {
  input: any;
  code: string | null;
  name: string;
  quantity: number;
  costUSD: number;
  marginClientPct: number;
  marginAllyPct: number;
  marginWholesalePct: number;
  priceClientUSD: number;
  priceAllyUSD: number;
  priceWholesaleUSD: number;
  product?: any;
  estadoIA: string;
  accion: string;
};

function parseCsv(text: string, delimiter?: string): Array<Record<string,string>> {
  const dl = delimiter && delimiter.length ? delimiter : (text.indexOf(';') > -1 ? ';' : ',');
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (!lines.length) return [];
  const header = lines[0];
  const headers: string[] = [];
  {
    let cur = '';
    let inQ = false;
    for (let i = 0; i < header.length; i++) {
      const ch = header[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (!inQ && ch === dl) { headers.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    headers.push(cur.trim());
  }
  const rows: Array<Record<string,string>> = [];
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    let cur = '';
    let inQ = false;
    const cols: string[] = [];
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (!inQ && ch === dl) { cols.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur);
    const rec: Record<string,string> = {};
    for (let i = 0; i < headers.length; i++) {
      const key = String(headers[i] || '').trim();
      rec[key] = (cols[i] ?? '').trim();
    }
    rows.push(rec);
  }
  return rows;
}

export default function PurchaseCsvUploader({ suppliers }: { suppliers: Supplier[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState<string>(',');
  const [currency, setCurrency] = useState<'USD'|'VES'>('USD');
  const [tasa, setTasa] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<string>('');
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const sampleUrl = useMemo(() => '/samples/purchases_template.csv', []);

  const onPick = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    setError(null);
    setOk(null);
    if (!f) return;
    try {
      setLoading(true);
      const text = await f.text();
      const rows = parseCsv(text, delimiter);
      if (!rows.length) { setError('CSV vacío'); return; }
      // map to expected fields for compare endpoint
      const lines = rows.map((r) => ({
        code: (r['code'] || r['sku'] || r['barcode'] || '').trim() || null,
        name: (r['name'] || r['producto'] || r['product'] || '').trim(),
        quantity: Number(String(r['quantity'] || r['qty'] || r['cantidad'] || '0').replace(',','.')),
        unitCost: Number(String(r['costUSD'] || r['unitCost'] || r['cost'] || '0').replace(',','.')),
      })).filter(l => l.name && l.quantity > 0);
      const body = { currency, tasaVES: tasa, lines };
      const res = await fetch('/api/purchases/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !Array.isArray(json.items)) { setError(json?.error || 'No se pudo previsualizar'); return; }
      setPreview(json.items as PreviewItem[]);
    } finally { setLoading(false); }
  };

  const save = async () => {
    try {
      setLoading(true); setError(null); setOk(null);
      const items = (preview || []).map((it) => ({
        productId: it.product?.id || null,
        code: it.code,
        name: it.name,
        quantity: it.quantity,
        costUSD: it.costUSD,
        marginClientPct: it.marginClientPct,
        marginAllyPct: it.marginAllyPct,
        marginWholesalePct: it.marginWholesalePct,
      }));
      const body = { supplierId: supplierId || null, currency, tasaVES: tasa, items };
      const res = await fetch('/api/purchases/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setError(json?.error || 'No se pudo guardar'); return; }
      setOk(json?.id || 'ok');
      try { window.location.href = '/dashboard/admin/compras?message=Compra%20guardada'; } catch {}
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-700">Proveedor (opcional)</label>
          <select value={supplierId} onChange={(e)=>setSupplierId(e.target.value)} className="form-select">
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Moneda</label>
          <select value={currency} onChange={(e)=>setCurrency(e.target.value as any)} className="form-select">
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Tasa VES</label>
          <input value={tasa} onChange={(e)=>setTasa(Number(e.target.value))} type="number" step="0.0001" className="form-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Separador</label>
          <select value={delimiter} onChange={(e)=>setDelimiter(e.target.value)} className="form-select">
            <option value=",">, (coma)</option>
            <option value=";">; (punto y coma)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input type="file" accept=".csv,text/csv" onChange={(e)=>onPick(e.target.files?.[0] || null)} />
        <a href={sampleUrl} className="text-sm text-blue-600 underline" download>Descargar plantilla CSV</a>
        <a href="/api/reports/products-csv" className="text-sm text-blue-600 underline" target="_blank">Exportar productos</a>
      </div>
      {loading && <div className="text-sm text-gray-600">Procesando…</div>}
      {error && <div className="text-sm text-red-700">{error}</div>}
      {preview && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Producto</th>
                <th className="px-2 py-1">Código/SKU</th>
                <th className="px-2 py-1">Cantidad</th>
                <th className="px-2 py-1">Costo USD</th>
                <th className="px-2 py-1">Precio Cliente</th>
                <th className="px-2 py-1">Precio Aliado</th>
                <th className="px-2 py-1">Precio Mayor</th>
                <th className="px-2 py-1">Acción</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((it, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1 text-left">{it.name}</td>
                  <td className="border px-2 py-1 text-center">{it.code || '-'}</td>
                  <td className="border px-2 py-1 text-center">{it.quantity}</td>
                  <td className="border px-2 py-1 text-right">{it.costUSD.toFixed(4)}</td>
                  <td className="border px-2 py-1 text-right">{it.priceClientUSD.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{it.priceAllyUSD.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{it.priceWholesaleUSD.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-center">{it.accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <button onClick={save} className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading}>Guardar Compra</button>
          </div>
        </div>
      )}
      {ok && !error && <div className="text-sm text-green-700">Compra guardada: {ok}</div>}
    </div>
  );
}

