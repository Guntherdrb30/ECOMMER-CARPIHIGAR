'use client';

import { useEffect, useMemo, useState } from 'react';

type ProductLite = { id: string; name: string; categoryId?: string | null };

export default function RelatedProductsPicker({
  products,
  name = 'relatedIds[]',
  defaultValue = [],
  watchCategoryName = 'categoryId',
}: {
  products: ProductLite[];
  name?: string;
  defaultValue?: string[];
  watchCategoryName?: string;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  useEffect(() => {
    const sel = document.querySelector(`select[name="${watchCategoryName}"]`) as HTMLSelectElement | null;
    const handler = () => setCat(sel?.value || '');
    handler();
    sel?.addEventListener('change', handler);
    return () => sel?.removeEventListener('change', handler);
  }, [watchCategoryName]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return products
      .filter((p) => (!cat || cat === '' || p.categoryId === cat))
      .filter((p) => (!qq || p.name.toLowerCase().includes(qq)))
      .slice(0, 500);
  }, [products, q, cat]);

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-700">Productos relacionados</label>
      <input
        type="text"
        placeholder="Buscar productos por nombre"
        className="w-full border rounded px-2 py-1"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select name={name} multiple defaultValue={defaultValue as any} className="w-full border rounded px-2 py-1 min-h-[140px]">
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-600">Se filtra por la categoría seleccionada y por texto.</p>
    </div>
  );
}

