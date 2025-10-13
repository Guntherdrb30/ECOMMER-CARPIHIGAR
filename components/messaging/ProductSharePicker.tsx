"use client";
import { useEffect, useMemo, useState } from 'react';
import { PendingButton } from '@/components/pending-button';
import { sendProductLinkAction } from '@/server/actions/messaging';

type Product = { id: string; name: string; sku?: string|null; slug: string; images?: string[] };

export default function ProductSharePicker({ toPhone }: { toPhone: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const origin = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (!q) { setItems([]); return; }
      try {
        setLoading(true);
        const r = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal, cache: 'no-store' });
        if (r.ok) {
          const json = await r.json();
          setItems(Array.isArray(json) ? json : []);
        }
      } finally { setLoading(false); }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  return (
    <div className="border rounded p-2 bg-white">
      <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar producto por nombre/SKU" className="w-full border rounded px-2 py-1 text-sm mb-2" />
      {loading && <div className="text-xs text-gray-500">Buscando...</div>}
      <div className="max-h-60 overflow-auto divide-y">
        {items.map((p) => {
          const img = (p.images && p.images[0]) || '';
          const url = `${origin}/productos/${p.slug}`;
          return (
            <div key={p.id} className="py-2 flex items-center gap-2">
              {img ? (<img src={img} alt={p.name} className="h-10 w-10 object-cover rounded" />) : (<div className="h-10 w-10 bg-gray-200 rounded" />)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-gray-500">SKU: {p.sku || '—'}</div>
              </div>
              <form action={sendProductLinkAction as any} className="flex items-center gap-1">
                <input type="hidden" name="toPhone" value={toPhone} />
                <input type="hidden" name="productUrl" value={url} />
                <input name="text" placeholder="Texto opc." className="border rounded px-2 py-1 text-xs max-w-[140px]" />
                <PendingButton className="px-2 py-1 border rounded text-xs" pendingText="Enviando...">Enviar</PendingButton>
              </form>
            </div>
          );
        })}
        {!loading && q && items.length === 0 && (
          <div className="py-2 text-xs text-gray-500">Sin resultados</div>
        )}
      </div>
    </div>
  );
}
