"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Cat = { id: string; name: string; slug: string; image?: string; productCount?: number; children?: Array<{ id: string; name: string; slug: string }>; };

export default function CategoryGrid({ items, showSearch = true }: { items: Cat[]; showSearch?: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const qq = q.toLowerCase();
    return items.filter(c => c.name.toLowerCase().includes(qq) || (c.children || []).some(s => s.name.toLowerCase().includes(qq)));
  }, [q, items]);

  return (
    <div>
      {showSearch && (
        <div className="mb-6 flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full md:max-w-md border rounded px-3 py-2 shadow-sm focus:ring-brand focus:border-brand"
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((cat) => {
          const hasImg = !!cat.image;
          return (
            <Link key={cat.id} href={`/productos?categoria=${cat.slug}`} className="group relative rounded-xl overflow-hidden shadow hover:shadow-lg transition-all bg-white aspect-square">
              <div className={`absolute inset-0 ${hasImg ? 'bg-cover bg-center' : 'bg-gray-200'} transition-transform duration-500 group-hover:scale-105`} style={hasImg ? { backgroundImage: `url('${cat.image}')` } : undefined} />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 h-full p-4 flex flex-col justify-end text-white">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-bold truncate">{cat.name}</h3>
                  {typeof cat.productCount === 'number' && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{cat.productCount} productos</span>
                  )}
                </div>
                {!!(cat.children?.length) && (
                  <div className="mt-2 flex flex-wrap gap-1.5 overflow-hidden">
                    {cat.children!.slice(0, 6).map((c) => (
                      <span key={c.id} className="text-[11px] bg-white/10 hover:bg-white/20 rounded-full px-2 py-0.5 truncate">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
