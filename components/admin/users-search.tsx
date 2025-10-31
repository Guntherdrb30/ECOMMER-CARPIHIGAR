"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UsersSearch({ placeholder = "Buscar por nombre, email, teléfono o Cédula/RIF" }: { placeholder?: string }) {
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
      <div className="text-xs text-gray-500 mt-1">Escribe nombre, email, teléfono o Cédula/RIF</div>
    </div>
  );
}

