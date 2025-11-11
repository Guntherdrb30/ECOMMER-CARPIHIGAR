"use client";

import { useState } from 'react';

export default function AddressForm({ userId }: { userId?: string }) {
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address1, setAddress1] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = { userId: userId || '', addressJson: { fullname, phone, city, state: '', zone: '', address1, address2: '', notes } };
      const res = await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_address', payload }) });
      const json = await res.json();
      setMsg(json?.message || 'Guardado');
    } catch {
      setMsg('No se pudo guardar');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={onSubmit} className="p-3 space-y-2">
      <div className="font-semibold text-gray-900">Dirección de envío</div>
      <input className="w-full border rounded px-2 py-1" placeholder="Nombre del receptor" value={fullname} onChange={(e) => setFullname(e.target.value)} />
      <input className="w-full border rounded px-2 py-1" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="w-full border rounded px-2 py-1" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
      <textarea className="w-full border rounded px-2 py-1 min-h-[80px]" placeholder="Dirección completa" value={address1} onChange={(e) => setAddress1(e.target.value)} />
      <input className="w-full border rounded px-2 py-1" placeholder="Referencias" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex gap-2 pt-1">
        <button disabled={saving} className="flex-1 px-3 py-2 rounded bg-[#E62C1A] text-white hover:scale-105 transition-transform disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar dirección'}</button>
      </div>
      {msg && (<div className="text-xs text-gray-600">{msg}</div>)}
    </form>
  );
}

