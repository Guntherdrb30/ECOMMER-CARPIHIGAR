"use client";

import { useRouter } from 'next/navigation';

type Cat = { id: string; slug: string; name: string; depth?: number };

export default function CategorySelect({ categories, value, basePath = '/productos', className }: { categories: Cat[]; value?: string; basePath?: string; className?: string }) {
  const router = useRouter();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (!slug) router.push(basePath);
    else router.push(`${basePath}?categoria=${encodeURIComponent(slug)}`);
  };

  return (
    <select id="category" defaultValue={value || ''} onChange={onChange} className={className || "border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"}>
      <option value="">Todas las Categorías</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.slug}>{`${'— '.repeat(cat.depth || 0)}${cat.name}`}</option>
      ))}
    </select>
  );
}

