"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

type Row = { bucket: string; count: number; totalUSD: number };

export default function ReceivablesAgingChart({ data }: { data: Row[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-80">
      <div className="font-semibold mb-2">Cuentas por Cobrar - Antigüedad</div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" />
          <YAxis yAxisId="left" orientation="left" tickFormatter={(v) => `${v}`}/>
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v}`}/>
          <Tooltip formatter={(v: any, n: string) => (n === 'count' ? [String(v), 'Cuentas'] : [`$${Number(v).toFixed(2)}`, 'Total USD'])} />
          <Legend formatter={(v) => v === 'count' ? 'Cuentas' : 'Total USD'} />
          <Bar yAxisId="left" dataKey="count" fill="#10b981" radius={[4,4,0,0]} name="Cuentas" />
          <Bar yAxisId="right" dataKey="totalUSD" fill="#2563eb" radius={[4,4,0,0]} name="Total USD" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

