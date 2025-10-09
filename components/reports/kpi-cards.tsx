"use client";

type Kpi = { label: string; value: string; subtitle?: string };

export default function KpiCards({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((k) => (
        <div key={k.label} className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">{k.label}</div>
          <div className="text-2xl font-bold">{k.value}</div>
          {k.subtitle ? <div className="text-xs text-gray-500 mt-1">{k.subtitle}</div> : null}
        </div>
      ))}
    </div>
  );
}

