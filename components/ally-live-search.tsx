"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AllyItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  services: string[];
  totalRevenueUSD: number;
  ordersCount: number;
};

export default function AllyLiveSearch({ placeholder = "Buscar aliado o servicio...", onQueryChange }: { placeholder?: string; onQueryChange?: (q: string) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AllyItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const tRef = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Debounced fetch of suggestions
  useEffect(() => {
    onQueryChange?.(q);
    if (tRef.current) window.clearTimeout(tRef.current);
    if (!q.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    tRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/allies/suggest?q=${encodeURIComponent(q)}&limit=10`, { cache: 'no-store' });
        const data = await r.json();
        setItems(Array.isArray(data?.items) ? data.items : []);
        setOpen(true);
      } catch {
        setItems([]);
        setOpen(false);
      }
    }, 250);
    return () => { if (tRef.current) window.clearTimeout(tRef.current); };
  }, [q, onQueryChange]);

  // Accessibility/keyboard
  useEffect(() => { setActive(-1); }, [q]);
  useEffect(() => { setActive((idx) => Math.min(idx, Math.max(items.length - 1, -1))); }, [items.length]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { const el = rootRef.current; if (el && !el.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true);
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) setActive((i) => (i + 1) % items.length); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) setActive((i) => (i <= 0 ? items.length - 1 : i - 1)); return; }
    if (e.key === 'Tab') { if (items.length && open) { e.preventDefault(); if (e.shiftKey) setActive((i)=> (i<=0? items.length-1 : i-1)); else setActive((i)=> (i+1)%items.length); } return; }
    if (e.key === 'Enter') {
      if (open && active >= 0 && active < items.length) {
        e.preventDefault();
        const it = items[active];
        router.push(`/aliados/${it.id}`);
        setOpen(false);
      }
    }
    if (e.key === 'Escape') { setOpen(false); }
  };

  const tokens = useMemo(() => q.split(/\s+/).filter(Boolean).map((t) => t.toLowerCase()), [q]);
  function highlight(text: string) {
    if (!tokens.length) return text;
    const lower = text.toLowerCase();
    const ranges: Array<{ s: number; e: number }> = [];
    for (const t of tokens) {
      let idx = 0; while (t && (idx = lower.indexOf(t, idx)) !== -1) { ranges.push({ s: idx, e: idx + t.length }); idx += t.length; }
    }
    if (!ranges.length) return text;
    ranges.sort((a,b)=> a.s-b.s || a.e-b.e);
    const merged: Array<{ s:number; e:number }> = [];
    for (const r of ranges) { if (!merged.length || r.s > merged[merged.length-1].e) merged.push({ ...r }); else merged[merged.length-1].e = Math.max(merged[merged.length-1].e, r.e); }
    const out: any[] = []; let cur = 0; let i=0;
    for (const r of merged) { if (cur < r.s) out.push(<span key={`t-${i++}`}>{text.slice(cur, r.s)}</span>); out.push(<mark key={`h-${i++}`} className="bg-yellow-200 px-0.5 rounded-sm">{text.slice(r.s, r.e)}</mark>); cur = r.e; }
    if (cur < text.length) out.push(<span key={`t-${i++}`}>{text.slice(cur)}</span>);
    return out;
  }

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full md:w-80 border rounded px-3 py-2 shadow-sm focus:ring-brand focus:border-brand"
        />
        <button type="button" className="px-3 py-1 rounded bg-brand hover:bg-opacity-90 text-white" onClick={() => { /* no list page; keep dropdown behaviour */ if (items.length) router.push(`/aliados/${items[0].id}`); }}>
          Buscar
        </button>
      </div>
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow" role="listbox" aria-expanded={open}>
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              role="option"
              aria-selected={idx === active}
              onMouseEnter={() => setActive(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => router.push(`/aliados/${it.id}`)}
              className={`w-full text-left px-3 py-2 flex gap-3 items-center ${idx === active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-none">
                {it.profileImageUrl ? <img src={it.profileImageUrl} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{highlight(it.name || 'Aliado')}</div>
                <div className="text-xs text-gray-500 truncate">{it.services?.slice(0,3).join(' · ')}</div>
              </div>
              <div className="text-xs text-gray-600 whitespace-nowrap">${it.totalRevenueUSD.toFixed(2)} · {it.ordersCount} ventas</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

