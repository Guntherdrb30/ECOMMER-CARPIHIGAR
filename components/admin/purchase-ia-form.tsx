"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import PurchasePreviewTable, { type CompareItem } from "./purchase-preview-table";

type Supplier = {
  id: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

type BankAccount = {
  id: string;
  name: string;
  bankName?: string | null;
  accountNumber?: string | null;
  currency: 'USD' | 'VES' | 'USDT';
};

export default function PurchaseIAForm({
  suppliers,
  defaultTasa,
  defaultIvaPercent,
  bankAccounts,
}: {
  suppliers: Supplier[];
  defaultTasa: number;
  defaultIvaPercent: number;
  bankAccounts: BankAccount[];
}) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [currency, setCurrency] = useState<'USD' | 'VES'>("USD");
  const [tasaVES, setTasaVES] = useState<number>(defaultTasa || 0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CompareItem[] | null>(null);

  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'VES' | 'USDT'>('USD');
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId) || null,
    [supplierId, suppliers],
  );

  const canUpload = useMemo(() => !!file, [file]);

  const handleUpload = async () => {
    if (!file) { toast.error('Selecciona un archivo'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('currency', currency);
      if (currency === 'VES') fd.append('tasaVES', String(tasaVES || 0));
      const up = await fetch('/api/upload-invoice', { method: 'POST', body: fd, credentials: 'include' });
      const parsed = await up.json();
      if (!up.ok) throw new Error(parsed?.error || 'No se pudo leer el archivo');
      const compareRes = await fetch('/api/purchases/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currency: parsed.currency || currency,
          tasaVES: parsed.tasaVES || tasaVES,
          lines: parsed.lines || [],
        }),
      });
      const cmp = await compareRes.json();
      if (!compareRes.ok) throw new Error(cmp?.error || 'Error comparando productos');
      const arr = Array.isArray(cmp.items) ? cmp.items : [];
      if (!arr.length) {
        toast.error('No se detectaron productos en el archivo');
        return;
      }
      setItems(arr);
      toast.success('Factura precargada');
    } catch (e: any) {
      toast.error(e?.message || 'Error en carga');
    } finally {
      setLoading(false);
    }
  };

  if (items) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-sm text-gray-600">Proveedor</div>
            <div className="font-semibold">
              {selectedSupplier?.name || '—'}
            </div>
            {selectedSupplier && (
              <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                {selectedSupplier.taxId && <div>RIF: {selectedSupplier.taxId}</div>}
                {selectedSupplier.address && <div className="line-clamp-2">{selectedSupplier.address}</div>}
                {selectedSupplier.contactName && (
                  <div>
                    Contacto: {selectedSupplier.contactName}
                    {selectedSupplier.contactPhone ? ` (${selectedSupplier.contactPhone})` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-600">Moneda factura</div>
            <div>{currency}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tasa (VES→USD)</div>
            <div>{currency === 'VES' ? (tasaVES || 0).toFixed(2) : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">N° factura</div>
            <div>{invoiceNumber || '—'}</div>
          </div>
        </div>
        <PurchasePreviewTable
          items={items}
          supplierId={supplierId || undefined}
          currency={currency}
          tasaVES={tasaVES}
          invoiceNumber={invoiceNumber || undefined}
          defaultIvaPercent={defaultIvaPercent}
          paymentCurrency={paymentCurrency}
          bankAccountId={bankAccountId || undefined}
          paymentReference={paymentReference || undefined}
          onCancel={() => setItems(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="form-label">Proveedor</label>
          <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Moneda de la factura</label>
          <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value as any)}>
            <option value="USD">USD</option>
            <option value="VES">Bs</option>
          </select>
        </div>
        <div>
          <label className="form-label">Tasa del día (VES→USD)</label>
          <input className="form-input" type="number" step={0.01} value={tasaVES} onChange={(e) => setTasaVES(parseFloat(e.target.value || '0'))} disabled={currency !== 'VES'} />
        </div>
        <div>
          <label className="form-label">N° factura</label>
          <input
            className="form-input"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Número de factura legal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="form-label">Moneda del pago</label>
          <select
            className="form-select"
            value={paymentCurrency}
            onChange={(e) => setPaymentCurrency(e.target.value as any)}
          >
            <option value="USD">USD</option>
            <option value="VES">Bs</option>
            <option value="USDT">Binance / USDT</option>
          </select>
        </div>
        <div>
          <label className="form-label">Banco / cuenta</label>
          <select
            className="form-select"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
          >
            <option value="">Sin vínculo de banco</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.bankName ? `- ${b.bankName}` : ''} ({b.currency})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Referencia de pago</label>
          <input
            className="form-input"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Ref. bancaria / TxID (opcional)"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Factura o lista (PDF/CSV)</label>
        <input className="form-input" type="file" accept="application/pdf,text/csv,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <div>
        <button disabled={!canUpload || loading} onClick={handleUpload} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
          {loading ? 'Procesando…' : 'Subir y precargar'}
        </button>
      </div>
    </div>
  );
}

