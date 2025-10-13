"use client";

import { useMemo, useState } from 'react';

type PreviewItem = {
  input: any;
  name: string;
  code?: string | null;
  sku?: string | null;
  barcode?: string | null;
  stock?: number;
  costUSD?: number;
  brand?: string | null;
  description?: string | null;
  categorySlug?: string | null;
  supplierId?: string | null;
  images?: string[];
  product?: any;
  marginClientPct: number;
  marginAllyPct: number;
  marginWholesalePct: number;
  priceClientUSD?: number;
  priceAllyUSD?: number;
  priceWholesaleUSD?: number;
  accion: 'CREAR' | 'ACTUALIZAR';
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

export default function ProductCsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState<string>(',');
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  const sampleUrl = useMemo(() => '/samples/products_template.csv', []);

  const onPick = async (f: File | null) => {
    setFile(f); setPreview(null); setError(null); setOk(false);
    if (!f) return;
    try {
      setLoading(true);
      const text = await f.text();
      const rows = parseCsv(text, delimiter);
      if (!rows.length) { setError('CSV vacío'); return; }
      const lines = rows.map((r) => ({
        name: (r['name'] || r['producto'] || r['product'] || '').trim(),
        code: (r['code'] || '').trim() || null,
        sku: (r['sku'] || '').trim() || null,
        barcode: (r['barcode'] || r['ean'] || r['ean13'] || '').trim() || null,
        stock: Number(String(r['stock'] || r['existencia'] || r['cantidad'] || '0').replace(',','.')),
        costUSD: r['costUSD'] ? Number(String(r['costUSD']).replace(',','.')) : undefined,
        brand: (r['brand'] || r['marca'] || '').trim() || null,
        description: (r['description'] || r['descripcion'] || r['descripción'] || '').trim() || null,
        categorySlug: (r['category'] || r['categoria'] || r['categoría'] || r['categorySlug'] || '').trim() || null,
        supplierId: (r['supplierId'] || r['proveedorId'] || '').trim() || null,
        images: (r['images'] || r['imagenes'] || r['imágenes'] || '').split(/[|;,\s]+/g).map(s => s.trim()).filter(Boolean).slice(0,4),
      })).filter(l => l.name);
      const res = await fetch('/api/products/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines }) });
      const json = await res.json();
      if (!res.ok || !Array.isArray(json.items)) { setError(json?.error || 'No se pudo previsualizar'); return; }
      setPreview(json.items as PreviewItem[]);
    } finally { setLoading(false); }
  };

  const applyImport = async () => {
    try {
      setLoading(true); setError(null); setOk(false);
      const items = (preview || []).map((it) => ({
        name: it.name,
        code: it.code,
        sku: it.sku,
        barcode: it.barcode,
        stock: it.stock,
        costUSD: it.costUSD,
        brand: it.brand,
        description: it.description,
        categorySlug: it.categorySlug,
        supplierId: it.supplierId,
        images: it.images || [],
      }));
      const res = await fetch('/api/products/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) { setError(json?.error || 'No se pudo importar'); return; }
      setOk(true);
      try { window.location.href = '/dashboard/admin/productos?message=Productos%20importados'; } catch {}
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">Archivo CSV</label>
          <input type="file" accept=".csv,text/csv" onChange={(e)=>onPick(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Separador</label>
          <select value={delimiter} onChange={(e)=>setDelimiter(e.target.value)} className="form-select">
            <option value=",">, (coma)</option>
            <option value=";">; (punto y coma)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <a href={sampleUrl} className="text-blue-600 underline" download>Descargar plantilla CSV</a>
        <a href="/api/reports/products-csv" className="text-blue-600 underline" target="_blank">Exportar productos actuales</a>
      </div>
      {loading && <div className="text-sm text-gray-600">Procesando…</div>}
      {error && <div className="text-sm text-red-700">{error}</div>}
      {preview && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Producto</th>
                <th className="px-2 py-1">Código/SKU/EAN</th>
                <th className="px-2 py-1">Stock</th>
                <th className="px-2 py-1">Costo USD</th>
                <th className="px-2 py-1">Precio Cliente</th>
                <th className="px-2 py-1">Aliado</th>
                <th className="px-2 py-1">Mayor</th>
                <th className="px-2 py-1">Acción</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((it, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1 text-left">{it.name}</td>
                  <td className="border px-2 py-1 text-center">{it.code || it.sku || it.barcode || '-'}</td>
                  <td className="border px-2 py-1 text-center">{it.stock ?? 0}</td>
                  <td className="border px-2 py-1 text-right">{typeof it.costUSD === 'number' ? it.costUSD.toFixed(4) : '-'}</td>
                  <td className="border px-2 py-1 text-right">{typeof it.priceClientUSD === 'number' ? it.priceClientUSD.toFixed(2) : '-'}</td>
                  <td className="border px-2 py-1 text-right">{typeof it.priceAllyUSD === 'number' ? it.priceAllyUSD.toFixed(2) : '-'}</td>
                  <td className="border px-2 py-1 text-right">{typeof it.priceWholesaleUSD === 'number' ? it.priceWholesaleUSD.toFixed(2) : '-'}</td>
                  <td className="border px-2 py-1 text-center">{it.accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <button onClick={applyImport} className="bg-emerald-600 text-white px-3 py-1 rounded" disabled={loading}>Aplicar cambios</button>
          </div>
        </div>
      )}
      {ok && !error && <div className="text-sm text-green-700">Importación completada</div>}
    </div>
  );
}

