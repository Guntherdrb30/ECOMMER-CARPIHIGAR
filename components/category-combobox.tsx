"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: string; slug: string; name: string; depth?: number };

function normalize(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function CategoryCombobox({
  categories,
  value,
  basePath = "/productos",
  className,
  placeholder = "Buscar o seleccionar categoría...",
}: {
  categories: Cat[];
  value?: string;
  basePath?: string;
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => categories.find(c => c.slug === value), [categories, value]);
  const list = useMemo(() => {
    const q = normalize(query);
    const arr = q
      ? categories.filter(c => normalize(c.name).includes(q))
      : categories;
    return arr.slice(0, 200); // limitar resultados
  }, [categories, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const it = list[activeIndex];
      if (it) onSelect(it.slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  function onSelect(slug: string) {
    setOpen(false);
    setQuery("");
    if (!slug) router.push(basePath);
    else router.push(`${basePath}?categoria=${encodeURIComponent(slug)}`);
  }

  return (
    <div ref={wrapRef} className="relative min-w-[260px]">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); setOpen(true); }}
        onKeyDown={onKeyDown}
        className={className || "w-full border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand px-3 py-2"}
      />
      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">⌄</div>
      {selected && !query && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-sm pr-6 truncate max-w-[80%]">
          {selected.name}
        </div>
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => onSelect("")}>Todas las Categorías</button>
          {list.map((c, idx) => (
            <button
              type="button"
              key={c.id}
              className={`block w-full text-left px-3 py-2 text-sm ${idx === activeIndex ? 'bg-blue-50' : ''}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => onSelect(c.slug)}
            >
              <span className="text-gray-500">{"— ".repeat(c.depth || 0)}</span>
              <span className="text-gray-800">{c.name}</span>
            </button>
          ))}
          {list.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}

