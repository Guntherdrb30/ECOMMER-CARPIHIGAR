"use client";

import { useMemo, useState } from "react";
import CategoryCard from "@/components/category-card";

type Cat = { id: string; name: string; slug: string; image?: string; productCount?: number; children?: Array<{ id: string; name: string; slug: string }>; };

export default function CategoryBrowser({ items }: { items: (Cat & { children?: Cat[] })[] }) {
  const [q, setQ] = useState("");
  const [parent, setParent] = useState<string>("");

  const roots = items;
  const allChildren: Cat[] = useMemo(() => roots.flatMap(r => (r.children || []).map(c => ({ ...c }))), [roots]);

  const baseList: Cat[] = useMemo(() => {
    if (parent) {
      const r = roots.find(r => r.slug === parent);
      return (r?.children || []) as Cat[];
    }
    // Mostrar subcategorías de todos los padres; si un padre no tiene hijos, incluirlo
    const withKids = allChildren;
    const loneRoots = roots.filter(r => !(r.children && r.children.length)).map(r => r as Cat);
    return [...withKids, ...loneRoots];
  }, [parent, roots, allChildren]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return baseList;
    return baseList.filter((c) =>
      c.name.toLowerCase().includes(s)
    );
  }, [q, baseList]);

  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Explorar Categorías</h1>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar categoría..."
              className="w-full md:w-96 border rounded px-3 py-2 shadow-sm focus:ring-brand focus:border-brand"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setParent("")}
              className={`px-3 py-1.5 rounded-full border text-sm ${parent === "" ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border-gray-200'}`}
            >
              Todas
            </button>
            {roots.map((c) => (
              <button
                key={c.id}
                onClick={() => setParent(c.slug)}
                className={`px-3 py-1.5 rounded-full border text-sm ${parent === c.slug ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border-gray-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
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
