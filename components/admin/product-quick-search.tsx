"use client";

import { useEffect, useRef, useState } from "react";

type Prod = { id: string; name: string; sku: string | null; priceUSD: number };

export default function ProductQuickSearch() {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Prod[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = q.trim();
      if (!query) { setFound([]); return; }
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setFound(json);
          setOpen(true);
        }
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o código (SKU)"
        className="w-full border rounded px-3 py-2"
        onFocus={() => { if (found.length) setOpen(true); }}
      />
      {open && found.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto">
          {found.map((p) => (
            <a
              key={p.id}
              href={`/dashboard/admin/productos/${p.id}`}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-gray-500">SKU: {p.sku || '—'}</span>
              </div>
              <span className="text-sm text-gray-700">${Number(p.priceUSD).toFixed(2)}</span>
            </a>
          ))}
          {found.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}

