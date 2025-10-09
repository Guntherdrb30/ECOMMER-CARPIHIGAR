"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Point = { date: string; revenueUSD: number; orders: number };

export default function SalesOverTimeChart({ data }: { data: Point[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-80">
      <div className="font-semibold mb-2">Ventas por día</div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={20} />
          <YAxis yAxisId="left" orientation="left" tickFormatter={(v) => `$${v}`}/>
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}`}/>
          <Tooltip formatter={(v: any, n: string) => (n === 'revenueUSD' ? [`$${Number(v).toFixed(2)}`, 'Ingresos'] : [String(v), 'Órdenes'])} labelFormatter={(l) => `Fecha: ${l}`} />
          <Legend formatter={(v) => v === 'revenueUSD' ? 'Ingresos' : 'Órdenes'} />
          <Area yAxisId="left" type="monotone" dataKey="revenueUSD" stroke="#2563eb" fillOpacity={1} fill="url(#rev)" name="Ingresos" />
          <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" fillOpacity={0.15} fill="#10b981" name="Órdenes" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

