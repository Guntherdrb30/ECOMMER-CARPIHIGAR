"use client";

import { useEffect, useState } from "react";

type Move = { id: string; product?: { name?: string }; type: string; quantity: number; reason?: string | null; createdAt: string };

export default function RecentMovesPanel({ take = 15 }: { take?: number }) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/recent-movements?take=${take}`);
      if (res.ok) setMoves(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('inventory-refresh', handler);
    return () => window.removeEventListener('inventory-refresh', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Movimientos recientes</h2>
        <a href="/dashboard/admin/productos" className="text-sm text-blue-600 hover:underline">Gestionar</a>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Cargando…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="border px-3 py-2">{m.product?.name || '—'}</td>
                  <td className="border px-3 py-2 text-center">{m.type}</td>
                  <td className="border px-3 py-2 text-center">{m.quantity}</td>
                  <td className="border px-3 py-2">{m.reason || '—'}</td>
                  <td className="border px-3 py-2">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!moves.length && (
                <tr><td className="px-3 py-2 text-sm text-gray-500" colSpan={5}>Sin movimientos recientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

