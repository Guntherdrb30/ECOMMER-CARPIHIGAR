"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

type AllySummary = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  services: string[];
  totalRevenueUSD: number;
  ordersCount: number;
};

export default function AlliesRankingClient({ items }: { items: AllySummary[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((a) =>
      (a.name || "").toLowerCase().includes(s) ||
      (a.email || "").toLowerCase().includes(s) ||
      (a.services || []).some((x) => (x || "").toLowerCase().includes(s))
    );
  }, [q, items]);

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold">Aliados Destacados</h2>
            <p className="text-gray-600">Conoce a nuestros mejores aliados y contáctalos.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar aliado o servicio..."
              className="w-full md:w-80 border rounded px-3 py-2 shadow-sm focus:ring-brand focus:border-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((a) => (
            <div key={a.id} className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-none">
                  {a.profileImageUrl ? (
                    <Image src={a.profileImageUrl} alt={a.name || 'Aliado'} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{a.name || 'Aliado'}</div>
                  <div className="text-xs text-gray-500">${a.totalRevenueUSD.toFixed(2)} · {a.ordersCount} ventas</div>
                </div>
              </div>
              {!!(a.services?.length) && (
                <div className="px-4 pb-2 flex flex-wrap gap-1">
                  {a.services.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-[11px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}
              <div className="px-4 pb-4 flex items-center gap-2">
                <Link href={`/aliados/${a.id}`} className="flex-1 text-center border rounded py-1.5 hover:bg-gray-50">Ver Perfil</Link>
                {a.phone ? (
                  <a href={`https://wa.me/${a.phone.replace(/[^0-9]/g,'')}`} target="_blank" className="flex-1 text-center bg-green-600 text-white rounded py-1.5 hover:bg-green-700">WhatsApp</a>
                ) : (
                  a.email ? <a href={`mailto:${a.email}`} className="flex-1 text-center bg-gray-800 text-white rounded py-1.5 hover:bg-gray-900">Email</a> : null
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-600 py-10">No se encontraron aliados para “{q}”.</div>
          )}
        </div>
      </div>
    </section>
  );
}

