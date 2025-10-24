'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Item = { id: string; name: string; slug: string; image?: string; stock: number; priceUSD: number };

export default function ProductLiveSearch({ placeholder = 'Buscar productos...', defaultQuery = '' }: { placeholder?: string; defaultQuery?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = defaultQuery || sp.get('q') || '';
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const tRef = useRef<any>(null);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    if (!q.trim()) { setItems([]); setOpen(false); return; }
    tRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const data = await r.json();
        setItems(Array.isArray(data?.items) ? data.items : []);
        setOpen(true);
      } catch {
        setItems([]);
        setOpen(false);
      }
    }, 250);
    return () => { if (tRef.current) clearTimeout(tRef.current); };
  }, [q]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (q.trim()) params.set('q', q.trim()); else params.delete('q');
    router.push(`/productos?${params.toString()}`);
    setOpen(false);
  };

  // Highlight helper: mark all token matches in name (case-insensitive)
  const tokens = useMemo(() => q.split(/\s+/).filter(Boolean).map((t) => t.toLowerCase()), [q]);
  function highlightName(name: string) {
    if (!tokens.length) return name;
    const lower = name.toLowerCase();
    // collect ranges
    const ranges: Array<{ s: number; e: number }> = [];
    for (const t of tokens) {
      let idx = 0;
      while (t && (idx = lower.indexOf(t, idx)) !== -1) {
        ranges.push({ s: idx, e: idx + t.length });
        idx = idx + t.length;
      }
    }
    if (!ranges.length) return name;
    // merge overlapping ranges
    ranges.sort((a,b) => a.s - b.s || a.e - b.e);
    const merged: Array<{ s: number; e: number }> = [];
    for (const r of ranges) {
      if (!merged.length || r.s > merged[merged.length-1].e) merged.push({ ...r });
      else merged[merged.length-1].e = Math.max(merged[merged.length-1].e, r.e);
    }
    // build nodes
    const out: any[] = [];
    let cur = 0; let i = 0;
    for (const r of merged) {
      if (cur < r.s) out.push(<span key={`t-${i++}`}>{name.slice(cur, r.s)}</span>);
      out.push(<mark key={`h-${i++}`} className="bg-yellow-200 px-0.5 rounded-sm">{name.slice(r.s, r.e)}</mark>);
      cur = r.e;
    }
    if (cur < name.length) out.push(<span key={`t-${i++}`}>{name.slice(cur)}</span>);
    return out;
  }

  return (
    <div className="relative">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
        />
        <button className="px-3 py-1 rounded bg-blue-600 text-white" type="submit">Buscar</button>
      </form>
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
          {items.map((it) => (
            <button key={it.id} type="button" onClick={() => router.push(`/productos/${it.slug}`)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex gap-3 items-center">
              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-none">
                {it.image ? <img src={it.image} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{highlightName(it.name)}</div>
                <div className="text-xs text-gray-500">{it.stock > 0 ? `Stock: ${it.stock}` : 'Agotado'}</div>
              </div>
              <div className="text-sm text-gray-700">{Number(it.priceUSD).toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
