"use client";

import { useState } from 'react';
import { useAssistant } from './hooks/useAssistant';

export default function PaymentForm() {
  const { continuePurchase, lastOrderId } = useAssistant() as any;
  const [method, setMethod] = useState<'ZELLE'|'TRANSFERENCIA'|'PAGO_MOVIL'>('ZELLE');
  const [reference, setReference] = useState('');
  const [currency, setCurrency] = useState<'USD'|'VES'>('USD');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerBank, setPayerBank] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      await continuePurchase('submitPayment', { orderId: lastOrderId, method, currency, reference, payerName, payerPhone, payerBank });
    } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="font-semibold text-gray-900">Pago manual</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600">Método</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full border rounded px-2 py-1 text-sm">
            <option value="ZELLE">Zelle</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="PAGO_MOVIL">Pago Móvil</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Moneda</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="w-full border rounded px-2 py-1 text-sm">
            <option value="USD">USD</option>
            <option value="VES">VES</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Referencia</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Referencia / comentario" />
      </div>
      {method === 'PAGO_MOVIL' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600">Titular</label>
            <input value={payerName} onChange={(e) => setPayerName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Teléfono</label>
            <input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Banco</label>
            <input value={payerBank} onChange={(e) => setPayerBank(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
        </div>
      )}
      <div>
        <button disabled={saving} className="px-3 py-2 rounded bg-[#E62C1A] text-white text-sm hover:scale-105 transition-transform disabled:opacity-50">{saving ? 'Enviando…' : 'Enviar comprobante'}</button>
      </div>
    </form>
  );
}
