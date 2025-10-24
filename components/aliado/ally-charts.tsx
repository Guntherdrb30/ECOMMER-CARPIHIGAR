"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export function AllySalesSeriesChart({ data }: { data: Array<{ date: string; revenueUSD: number; orders: number }> }) {
  const rows = useMemo(() => data.map(d => ({ ...d, revenue: Number(d.revenueUSD || 0) })), [data]);
  return (
    <div className="bg-white p-4 rounded-lg shadow h-72">
      <div className="text-sm font-semibold mb-2">Ventas por día (USD)</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v:any, n:any)=>[Number(v).toFixed(2), n==='revenue'?'USD':'Pedidos']} labelFormatter={(l)=>`Fecha: ${l}`} />
          <Line type="monotone" dataKey="revenue" name="USD" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AllyTopProductsChart({ data }: { data: Array<{ name: string; revenueUSD: number; qty: number }> }) {
  const rows = useMemo(() => data.map((d) => ({ name: d.name, revenue: Number(d.revenueUSD || 0), qty: Number(d.qty || 0) })).slice(0, 10), [data]);
  return (
    <div className="bg-white p-4 rounded-lg shadow h-72">
      <div className="text-sm font-semibold mb-2">Top productos por ingresos</div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v:any, n:any)=>[Number(v).toFixed(2), n==='revenue'?'USD':'Unidades']} />
          <Bar dataKey="revenue" name="USD" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

