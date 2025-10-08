"use client";

import { useEffect, useMemo, useState } from "react";

type Prod = { id: string; name: string; sku: string | null; priceUSD: number; priceAllyUSD?: number | null };
type Line = { productId: string; name: string; p1: number; p2?: number | null; priceUSD: number; quantity: number };

export default function OfflineSaleForm({ sellers, commissionPercent, ivaPercent, tasaVES, action }: { sellers: Array<{ id: string; name?: string; email: string }>, commissionPercent: number, ivaPercent: number, tasaVES: number, action: (formData: FormData) => void }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Prod[]>([]);
  const [items, setItems] = useState<Line[]>([]);
  const [sellerId, setSellerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerFiscalAddress, setCustomerFiscalAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"PAGO_MOVIL" | "TRANSFERENCIA" | "ZELLE">("ZELLE");
  const [paymentCurrency, setPaymentCurrency] = useState<"USD" | "VES">("USD");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string>("");
  const [pmPayerName, setPmPayerName] = useState("");
  const [pmPayerPhone, setPmPayerPhone] = useState("");
  const [pmBank, setPmBank] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [docType, setDocType] = useState<'recibo' | 'nota' | 'factura'>('factura');
  const [shippingLocalOption, setShippingLocalOption] = useState<'RETIRO_TIENDA' | 'DELIVERY' | ''>('');
  const [saleType, setSaleType] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  const [creditDueDate, setCreditDueDate] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setFound([]);
        return;
      }
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setFound(json);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((a, it) => a + it.priceUSD * it.quantity, 0);
    const iva = subtotal * (Number(ivaPercent) / 100);
    const totalUSD = subtotal + iva;
    const totalVES = totalUSD * Number(tasaVES);
    return { subtotal, iva, totalUSD, totalVES };
  }, [items, ivaPercent, tasaVES]);

  const addItem = (p: Prod, mode: 'P1' | 'P2' = 'P1') => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      const p1 = Number(p.priceUSD);
      const p2 = p.priceAllyUSD != null ? Number(p.priceAllyUSD) : undefined;
      const selected = mode === 'P2' && p2 != null ? p2 : p1;
      return [...prev, { productId: p.id, name: p.name, p1, p2, priceUSD: selected, quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, qty) } : l)));
  };

  const remove = (id: string) => setItems((prev) => prev.filter((l) => l.productId !== id));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setError("");
    if (!items.length) {
      e.preventDefault();
      setError('Debes agregar al menos un producto.');
      return;
    }
    if (!customerTaxId.trim() || !customerFiscalAddress.trim()) {
      e.preventDefault();
      setError('Cédula/RIF y dirección fiscal son obligatorias.');
      return;
    }
    if (saleType === 'CREDITO') {
      setLoading(true);
      return;
    }
    if (!paymentReference.trim()) {
      e.preventDefault();
      setError('La referencia de pago es obligatoria.');
      return;
    }
    if (paymentMethod === 'PAGO_MOVIL') {
      if (!pmPayerName.trim() || !pmPayerPhone.trim() || !pmBank.trim()) {
        e.preventDefault();
        setError('Para Pago Móvil completa nombre, teléfono y banco.');
        return;
      }
    }
    setLoading(true);
  };

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-700">Vendedor</label>
          <select name="sellerId" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="border rounded px-2 py-1 w-full" required>
            <option value="">Seleccione vendedor</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Cliente (Nombre)</label>
          <input name="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Cliente (Email)</label>
          <input type="email" name="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Tipo de venta</label>
          <select name="saleType" value={saleType} onChange={(e) => setSaleType(e.target.value as any)} className="border rounded px-2 py-1 w-full">
            <option value="CONTADO">Contado</option>
            <option value="CREDITO">Crédito</option>
          </select>
        </div>
        {saleType === 'CREDITO' && (
          <div>
            <label className="block text-sm text-gray-700">Fecha de vencimiento (opcional)</label>
            <input type="date" name="creditDueDate" value={creditDueDate} onChange={(e) => setCreditDueDate(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-700">Cédula / RIF</label>
          <input name="customerTaxId" required value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="V-12345678 ó J-12345678-9" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm text-gray-700">Dirección fiscal</label>
          <textarea name="customerFiscalAddress" required value={customerFiscalAddress} onChange={(e) => setCustomerFiscalAddress(e.target.value)} className="border rounded px-2 py-1 w-full min-h-[60px]" placeholder="Calle, edificio, piso, municipio, estado" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700">Buscar productos</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, SKU o código de barras" className="border rounded px-2 py-1 w-full" />
        {found.length > 0 && (
          <div className="mt-2 border rounded divide-y">
            {found.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 gap-2">
                <div className="flex-1 min-w-0 truncate">
                  <div className="truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">P1: ${Number(p.priceUSD).toFixed(2)}{p.priceAllyUSD != null ? ` · P2: $${Number(p.priceAllyUSD).toFixed(2)}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => addItem(p, 'P1')} className="px-2 py-0.5 border rounded text-sm">P1</button>
                  <button type="button" disabled={p.priceAllyUSD == null} onClick={() => addItem(p, 'P2')} className="px-2 py-0.5 border rounded text-sm disabled:opacity-50">P2</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Producto</th>
              <th className="px-2 py-1">Precio</th>
              <th className="px-2 py-1">Cantidad</th>
              <th className="px-2 py-1">Subtotal</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.productId}>
                <td className="border px-2 py-1">{l.name}</td>
                <td className="border px-2 py-1">
                  <select
                    value={(l.p2 != null && l.priceUSD === l.p2) ? 'P2' : 'P1'}
                    onChange={(e) => {
                      const mode = e.target.value as 'P1' | 'P2';
                      setItems((prev) => prev.map((x) => x.productId === l.productId ? { ...x, priceUSD: (mode === 'P2' && l.p2 != null) ? Number(l.p2) : Number(l.p1) } : x));
                    }}
                    className="border rounded px-1 py-0.5"
                  >
                    <option value="P1">P1 ${l.p1.toFixed(2)}</option>
                    <option value="P2" disabled={l.p2 == null}>P2 {l.p2 != null ? `$${Number(l.p2).toFixed(2)}` : '(N/A)'}</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <input type="number" min={1} value={l.quantity} onChange={(e) => updateQty(l.productId, parseInt(e.target.value || "1", 10))} className="w-20 border rounded px-1 py-0.5" />
                </td>
                <td className="border px-2 py-1">{(l.priceUSD * l.quantity).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">
                  <button type="button" onClick={() => remove(l.productId)} className="text-red-600 hover:underline">
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <input type="hidden" name="items" value={JSON.stringify(items.map(({ productId, name, priceUSD, quantity }) => ({ productId, name, priceUSD, quantity })))} />
      <input type="hidden" name="ivaPercent" value={String(ivaPercent)} />
      <input type="hidden" name="tasaVES" value={String(tasaVES)} />
      <input type="hidden" name="sendEmail" value={sendEmail ? 'true' : 'false'} />
      <input type="hidden" name="docType" value={docType} />
      <input type="hidden" name="saleType" value={saleType} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div className="text-sm text-gray-600">Comisión vendedor estimada: {commissionPercent.toFixed(2)}%</div>
        <div>
          <label className="block text-sm text-gray-700">Método de pago</label>
          <select name="paymentMethod" disabled={saleType === 'CREDITO'} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="border rounded px-2 py-1 w-full disabled:opacity-50">
            <option value="ZELLE">Zelle</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="PAGO_MOVIL">Pago Móvil</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Moneda del pago</label>
          <select name="paymentCurrency" disabled={saleType === 'CREDITO'} value={paymentCurrency} onChange={(e) => setPaymentCurrency(e.target.value as any)} className="border rounded px-2 py-1 w-full disabled:opacity-50">
            <option value="USD">USD</option>
            <option value="VES">Bs (VES)</option>
          </select>
        </div>
        {saleType === 'CONTADO' && paymentMethod === 'PAGO_MOVIL' && (
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700">Nombre del titular</label>
              <input name="pm_payer_name" value={pmPayerName} onChange={(e) => setPmPayerName(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Nombre y apellido" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Teléfono del titular</label>
              <input name="pm_payer_phone" value={pmPayerPhone} onChange={(e) => setPmPayerPhone(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="04xx-xxxxxxx" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Banco emisor</label>
              <input name="pm_bank" value={pmBank} onChange={(e) => setPmBank(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Banco del pago móvil" />
            </div>
          </div>
        )}
        <div className="md:col-span-3">
          <label className="block text-sm text-gray-700">Referencia</label>
          <input name="paymentReference" required value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className={`rounded px-2 py-1 w-full border ${error && !paymentReference.trim() ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`} placeholder="Nº ref, comentario, etc" />
          {error && !paymentReference.trim() && (
            <div className="text-xs text-red-600 mt-1">La referencia de pago es obligatoria.</div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white p-3 rounded border">
        <div className="flex items-center gap-2 mb-2">
          <input id="sendEmail" type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          <label htmlFor="sendEmail" className="text-sm text-gray-800">Enviar comprobante por email al cliente</label>
        </div>
        {sendEmail && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700">Email destino</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} name="customerEmail" className="border rounded px-2 py-1 w-full" placeholder="cliente@correo.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Documento a enviar</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value as any)} className="border rounded px-2 py-1 w-full">
                <option value="recibo">Recibo</option>
                <option value="nota">Nota de Entrega</option>
                <option value="factura">Factura</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-700">Entrega local (Barinas)</label>
        <select name="shippingLocalOption" value={shippingLocalOption} onChange={(e) => setShippingLocalOption(e.target.value as any)} className="border rounded px-2 py-1 w-full">
          <option value="">Automática</option>
          <option value="RETIRO_TIENDA">Retiro en tienda</option>
          <option value="DELIVERY">Delivery (incluido)</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">Si el cliente es de Barinas, puedes elegir entre Retiro en tienda o Delivery incluido.</div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">IVA: {Number(ivaPercent).toFixed(2)}% {paymentCurrency === "VES" && `· Tasa: ${Number(tasaVES).toFixed(2)}`}</div>
        <div className="text-right">
          <div>Subtotal: ${totals.subtotal.toFixed(2)}</div>
          <div>IVA: ${totals.iva.toFixed(2)}</div>
          <div className="font-semibold">Total: {paymentCurrency === "USD" ? `$${totals.totalUSD.toFixed(2)}` : `Bs ${totals.totalVES.toFixed(2)}`}</div>
        </div>
      </div>

      <div>
        <button disabled={loading || !items.length || !sellerId} formNoValidate={saleType === 'CREDITO'} className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50">
          Crear Venta
        </button>
      </div>
    </form>
  );
}
