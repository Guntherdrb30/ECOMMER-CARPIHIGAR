"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5 xl:gap-6">
        {filtered.map((cat) => {
          const hasImg = !!cat.image;
          return (
            <Link key={cat.id} href={`/productos?categoria=${cat.slug}`} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white border border-gray-200/60 aspect-[4/3] sm:aspect-square">
              {hasImg ? (
                <Image
                  src={cat.image as string}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  placeholder="blur"
                  blurDataURL="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                />
              ) : (
                <div className="absolute inset-0 bg-gray-100" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="relative z-10 h-full p-3 md:p-4 flex flex-col justify-end text-white">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base md:text-lg font-bold truncate">{cat.name}</h3>
                  {typeof cat.productCount === 'number' && (
                    <span className="hidden md:inline text-xs bg-white/20 px-2 py-0.5 rounded-full">{cat.productCount} productos</span>
                  )}
                </div>
                {!!(cat.children?.length) && (
                  <div className="mt-1.5 md:mt-2 flex flex-wrap gap-1.5 overflow-hidden">
                    {cat.children!.slice(0, 5).map((c) => (
                      <span key={c.id} className="text-[10px] md:text-[11px] bg-white/10 hover:bg-white/20 rounded-full px-2 py-0.5 truncate">
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
