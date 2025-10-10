"use client";
import { useMemo } from 'react';

export default function PhoneDisplay({ phone }: { phone: string }) {
  const formatted = useMemo(() => {
    const d = String(phone || '').replace(/[^0-9]/g, '');
    if (!d) return '';
    if (d.length === 10) return `+58${d}`;
    if (d.startsWith('58') && d.length === 12) return `+${d}`;
    return `+${d}`;
  }, [phone]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
    } catch {}
  };

  if (!formatted) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
      <span>Tel: {formatted}</span>
      <button type="button" onClick={copy} className="px-2 py-0.5 border rounded">Copiar</button>
      <a href={`tel:${formatted}`} className="px-2 py-0.5 border rounded">Llamar</a>
    </div>
  );
}

