"use client";

import { useState } from 'react';
import { toast } from 'sonner';

export default function DeliveryPayoutForm({ deliveryUserId, userLabel, from, to, pendingCount, pendingTotalUSD }: { deliveryUserId: string; userLabel: string; from: string; to: string; pendingCount: number; pendingTotalUSD: number; }) {
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFERENCIA');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ updated: number; totalUSD: number; pdfUrl?: string; csvUrl?: string; proofUrl?: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate) { toast.error('Fecha de pago requerida'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('deliveryUserId', deliveryUserId);
      fd.append('from', from);
      fd.append('to', to);
      fd.append('paymentMethod', paymentMethod);
      fd.append('paymentReference', paymentReference);
      fd.append('paymentDate', paymentDate);
      fd.append('paymentNotes', paymentNotes);
      if (proof) fd.append('proof', proof);
      const res = await fetch('/api/admin/delivery/payout', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo registrar el pago');
      setResult(data);
      toast.success('Pago registrado y entregas marcadas');
    } catch (e: any) {
      toast.error(e?.message || 'Error procesando pago');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded">
          Pago registrado. Entregas marcadas: {result.updated}. Total: ${'{'}result.totalUSD.toFixed(2){'}'}
        </div>
        <div className="space-y-2">
          {result.pdfUrl ? (<div><a className="text-blue-600 underline" href={result.pdfUrl} target="_blank" rel="noreferrer">Descargar comprobante de pago (PDF)</a></div>) : null}
          {result.csvUrl ? (<div><a className="text-blue-600 underline" href={result.csvUrl} target="_blank" rel="noreferrer">Descargar archivo de pago (CSV)</a></div>) : null}
          {result.proofUrl ? (<div>Soporte: <a className="text-blue-600 underline" href={result.proofUrl} target="_blank" rel="noreferrer">Ver archivo</a></div>) : null}
        </div>
        <div>
          <a className="px-3 py-2 rounded border" href={`/dashboard/admin/delivery/liquidaciones?${new URLSearchParams({ user: deliveryUserId, from, to }).toString()}`}>Volver a liquidaciones</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-gray-600">Delivery</div>
          <div className="font-medium">{userLabel}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Periodo</div>
          <div>{from} a {to}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Pendiente</div>
          <div>{pendingCount} entregas · ${'{'}pendingTotalUSD.toFixed(2){'}'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Método de pago</label>
          <select className="border rounded px-2 py-1 w-full" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="PAGO_MOVIL">Pago Móvil</option>
            <option value="ZELLE">Zelle</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Fecha de pago</label>
          <input className="border rounded px-2 py-1 w-full" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Referencia</label>
          <input className="border rounded px-2 py-1 w-full" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Ref. o nota" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Notas</label>
        <textarea className="border rounded px-2 py-1 w-full" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Detalles del pago opcionales" />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Soporte (PDF/imagen)</label>
        <input className="border rounded px-2 py-1 w-full" type="file" accept="application/pdf,image/*" onChange={(e) => setProof(e.target.files?.[0] || null)} />
      </div>

      <div>
        <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50" disabled={submitting}>
          {submitting ? 'Procesando…' : 'Confirmar y marcar pagado'}
        </button>
      </div>
    </form>
  );
}
