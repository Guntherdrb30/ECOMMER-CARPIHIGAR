"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Row = { name: string; value: number };

export default function SimpleBarChart({ title, data, valueLabel = 'Valor', currency = false }: { title: string; data: Row[]; valueLabel?: string; currency?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-80">
      <div className="font-semibold mb-2">{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tickFormatter={(v) => currency ? `$${v}` : String(v)} />
          <Tooltip formatter={(v: any) => currency ? `$${Number(v).toFixed(2)}` : String(v)} labelFormatter={(l) => l} />
          <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} name={valueLabel} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

