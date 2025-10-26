"use client";

import { useMemo, useState } from "react";
import CategoryCard from "@/components/category-card";

type Cat = { id: string; name: string; slug: string; image?: string; productCount?: number; children?: Array<{ id: string; name: string; slug: string }>; };

export default function CategoryBrowser({ items }: { items: Cat[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) =>
      c.name.toLowerCase().includes(s) || (c.children || []).some((k) => k.name.toLowerCase().includes(s))
    );
  }, [q, items]);

  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Explorar Categorías</h1>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar categoría o subcategoría..."
            className="w-full md:w-96 border rounded px-3 py-2 shadow-sm focus:ring-brand focus:border-brand"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filtered.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-600 py-10">No se encontraron categorías para “{q}”.</div>
          )}
        </div>
      </div>
    </section>
  );
}

