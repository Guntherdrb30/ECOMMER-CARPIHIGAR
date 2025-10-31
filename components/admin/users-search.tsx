"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UsersSearch({ placeholder = "Buscar por nombre, email, teléfono o Cédula/RIF", resultCount }: { placeholder?: string; resultCount?: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get("q") || "";
  const [q, setQ] = useState(initial);

  useEffect(() => {
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (q && q.trim()) url.searchParams.set("q", q.trim());
      else url.searchParams.delete("q");
      router.replace(url.pathname + (url.search || "") + (url.hash || ""));
    }, 300);
    return () => clearTimeout(t);
  }, [q, router]);

  useEffect(() => {
    // Sync if query param changes externally
    const current = sp.get("q") || "";
    if (current !== q) setQ(current);
  }, [sp]);

  return (
    <div className="mb-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="border rounded px-3 py-2 w-full"
      />
      <div className="flex items-center justify-between mt-1">
        <div className="text-xs text-gray-500">Escribe nombre, email, teléfono o Cédula/RIF</div>
        <div className="text-xs text-gray-600">{typeof resultCount === 'number' ? `Resultados: ${resultCount}` : ''}</div>
      </div>
      {q ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setQ("")}
            className="text-xs px-2 py-1 border rounded"
            aria-label="Limpiar búsqueda"
          >
            Limpiar
          </button>
        </div>
      ) : null}
    </div>
  );
}
