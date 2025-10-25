"use client";

import { useEffect, useMemo, useState } from "react";
import { venezuelaData } from "@/lib/venezuela-data";

type Prod = { id: string; name: string; sku: string | null; priceUSD: number };
type Line = { productId: string; name: string; priceUSD: number; quantity: number };

export default function QuoteForm({ sellers, ivaPercent, tasaVES, action, hideSeller }: { sellers: Array<{ id: string; name?: string; email: string }>, ivaPercent: number, tasaVES: number, action: (formData: FormData) => void, hideSeller?: boolean }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Prod[]>([]);
  const [items, setItems] = useState<Line[]>([]);
  const [sellerId, setSellerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerFiscalAddress, setCustomerFiscalAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  // Direcciones
  type Address = { id: string; fullname: string; phone: string; state: string; city: string; zone?: string | null; address1: string; address2?: string | null; notes?: string | null };
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addrMode, setAddrMode] = useState<'saved'|'new'>('new');
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addrState, setAddrState] = useState<string>("");
  const [addrCity, setAddrCity] = useState<string>("");
  const [addrZone, setAddrZone] = useState<string>("");
  const [addr1, setAddr1] = useState<string>("");
  const [addr2, setAddr2] = useState<string>("");
  const [addrNotes, setAddrNotes] = useState<string>("");
  const [cities, setCities] = useState<string[]>([]);

  // Preselect seller if there's exactly one option (e.g., aliado)
  useEffect(() => {
    if (sellers.length === 1 && !sellerId) {
      setSellerId(sellers[0].id);
    }
  }, [sellers, sellerId]);

  const singleSeller = sellers.length === 1 ? sellers[0] : null;

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setFound([]); return; }
      try { const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { credentials: "include" }); if (res.ok) setFound(await res.json()); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Cargar direcciones guardadas segun email del cliente (admin/aliado)
  useEffect(() => {
    const t = setTimeout(async () => {
      const e = (customerEmail || '').trim();
      if (!e) { setSavedAddresses([]); setAddrMode('new'); setSelectedAddressId(''); return; }
      try {
        const res = await fetch(`/api/admin/addresses/by-email?email=${encodeURIComponent(e)}`, { credentials: 'include' });
        if (res.ok) {
          const list: Address[] = await res.json();
          setSavedAddresses(list);
          if (list.length) {
            setAddrMode('saved');
            setSelectedAddressId(list[0].id);
            setAddrState(list[0].state || '');
            setAddrCity(list[0].city || '');
            setAddrZone(list[0].zone || '');
            setAddr1(list[0].address1 || '');
            setAddr2(list[0].address2 || '');
            setAddrNotes(list[0].notes || '');
          } else {
            setAddrMode('new');
            setSelectedAddressId('');
          }
        }
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [customerEmail]);

  // Actualizar ciudades al cambiar estado
  useEffect(() => {
    const st = venezuelaData.find(v => v.estado.toLowerCase() === (addrState || '').toLowerCase());
    setCities(st ? st.ciudades : []);
    if (st && !st.ciudades.includes(addrCity)) setAddrCity('');
  }, [addrState]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((a, it) => a + it.priceUSD * it.quantity, 0);
    const iva = subtotal * (Number(ivaPercent) / 100);
    const totalUSD = subtotal + iva;
    const totalVES = totalUSD * Number(tasaVES);
    return { subtotal, iva, totalUSD, totalVES };
  }, [items, ivaPercent, tasaVES]);

  const addItem = (p: Prod) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }; return next; }
      return [...prev, { productId: p.id, name: p.name, priceUSD: Number(p.priceUSD), quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => setItems((prev) => prev.map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, qty) } : l)));
  const remove = (id: string) => setItems((prev) => prev.filter((l) => l.productId !== id));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setError("");
    if (!items.length) { e.preventDefault(); setError('Debes agregar al menos un producto.'); return; }
    if (!customerPhone.trim()) { e.preventDefault(); setError('El teléfono del cliente es obligatorio.'); return; }
    if (addrMode === 'saved') {
      if (!selectedAddressId) { e.preventDefault(); setError('Selecciona una dirección guardada o crea una nueva.'); return; }
    } else {
      if (!addrState || !addrCity || !addr1.trim()) { e.preventDefault(); setError('Completa Estado, Ciudad y Dirección.'); return; }
    }
    setLoading(true);
  };

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          {!hideSeller && (
            <>
              <label className="block text-sm text-gray-700">Vendedor</label>
              {singleSeller ? (
                <>
                  <div className="border rounded px-2 py-1 w-full bg-gray-50 text-gray-700">
                    {singleSeller.name || singleSeller.email}
                  </div>
                  <input type="hidden" name="sellerId" value={singleSeller.id} />
                </>
              ) : (
                <select name="sellerId" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="border rounded px-2 py-1 w-full">
                  <option value="">Seleccione vendedor</option>
                  {sellers.map((s) => (<option key={s.id} value={s.id}>{s.name || s.email}</option>))}
                </select>
              )}
            </>
          )}
          {hideSeller && (<input type="hidden" name="sellerId" value={singleSeller?.id || sellerId} />)}
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
          <label className="block text-sm text-gray-700">Teléfono</label>
          <input name="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="04xx-xxxxxxx" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Cédula / RIF</label>
          <input name="customerTaxId" value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="V-12345678 ó J-12345678-9" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">Dirección fiscal</label>
          <textarea name="customerFiscalAddress" value={customerFiscalAddress} onChange={(e) => setCustomerFiscalAddress(e.target.value)} className="border rounded px-2 py-1 w-full min-h-[60px]" placeholder="Calle, edificio, piso, municipio, estado" />
        </div>
      </div>

      <div className="bg-white p-3 rounded border">
        <h3 className="font-semibold mb-2">Datos de envío</h3>
        {savedAddresses.length > 0 && (
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-1">Direcciones guardadas</div>
            <div className="space-y-1">
              {savedAddresses.map((a) => (
                <label key={a.id} className="flex items-start gap-2">
                  <input type="radio" name="addressRadio" checked={addrMode === 'saved' && selectedAddressId === a.id} onChange={() => { setAddrMode('saved'); setSelectedAddressId(a.id); setAddrState(a.state||''); setAddrCity(a.city||''); setAddrZone(a.zone||''); setAddr1(a.address1||''); setAddr2(a.address2||''); setAddrNotes(a.notes||''); }} />
                  <span className="text-sm text-gray-800">{a.address1}{a.address2 ? `, ${a.address2}` : ''} — {a.city}, {a.state} ({a.phone})</span>
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input type="radio" name="addressRadio" checked={addrMode === 'new'} onChange={() => { setAddrMode('new'); setSelectedAddressId(''); }} />
                <span className="text-sm text-gray-800">Nueva dirección</span>
              </label>
            </div>
          </div>
        )}
        <input type="hidden" name="shippingAddressId" value={addrMode === 'saved' ? selectedAddressId : ''} />
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${addrMode === 'saved' ? 'opacity-70 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm text-gray-700">Estado</label>
            <select name="addr_state" value={addrState} onChange={(e) => setAddrState(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="">Seleccione</option>
              {venezuelaData.map(v => (<option key={v.estado} value={v.estado}>{v.estado}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Ciudad</label>
            <select name="addr_city" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="">Seleccione ciudad</option>
              {cities.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Zona (opcional)</label>
            <input name="addr_zone" value={addrZone} onChange={(e) => setAddrZone(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700">Dirección</label>
            <input name="addr_address1" value={addr1} onChange={(e) => setAddr1(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Calle o avenida, casa o edificio" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Referencia</label>
            <input name="addr_address2" value={addr2} onChange={(e) => setAddr2(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Piso, apto, punto de referencia" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-700">Notas (opcional)</label>
            <textarea name="addr_notes" value={addrNotes} onChange={(e) => setAddrNotes(e.target.value)} className="border rounded px-2 py-1 w-full min-h-[60px]" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700">Buscar productos</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, SKU o código de barras" className="border rounded px-2 py-1 w-full" />
        {found.length > 0 && (
          <div className="mt-2 border rounded">
            {found.map((p) => (
              <button type="button" key={p.id} onClick={() => addItem(p)} className="flex justify-between w-full px-3 py-2 border-b hover:bg-gray-50">
                <span>{p.name} <span className="text-gray-500">({p.sku || '—'})</span></span>
                <span className="text-gray-700">${Number(p.priceUSD).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded border">
        <h3 className="font-semibold mb-2">Items del presupuesto</h3>
        {items.length === 0 && <div className="text-sm text-gray-500">Sin items aún</div>}
        {items.length > 0 && (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Producto</th>
                <th className="px-2 py-1 text-right">Precio</th>
                <th className="px-2 py-1 text-right">Cant.</th>
                <th className="px-2 py-1 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.productId}>
                  <td className="border px-2 py-1">{l.name}</td>
                  <td className="border px-2 py-1 text-right">${l.priceUSD.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">
                    <input type="number" min={1} value={l.quantity} onChange={(e) => updateQty(l.productId, parseInt(e.target.value || '1', 10))} className="w-20 border rounded px-2 py-1 text-right" />
                  </td>
                  <td className="border px-2 py-1 text-right">${(l.priceUSD * l.quantity).toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right"><button type="button" onClick={() => remove(l.productId)} className="text-red-600">Quitar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <input type="hidden" name="items" value={JSON.stringify(items)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div className="text-sm text-gray-600">IVA: {Number(ivaPercent).toFixed(2)}% · Tasa: {Number(tasaVES).toFixed(2)}</div>
        <div className="md:col-span-2 text-right">
          <div>Subtotal: ${totals.subtotal.toFixed(2)}</div>
          <div>IVA: ${totals.iva.toFixed(2)}</div>
          <div className="font-semibold">Total: ${totals.totalUSD.toFixed(2)}</div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700">Notas</label>
        <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Notas para el cliente (opcional)" />
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div>
        <button disabled={loading || !items.length} className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50">Crear Presupuesto</button>
      </div>
      <input type="hidden" name="ivaPercent" value={ivaPercent} />
      <input type="hidden" name="tasaVES" value={tasaVES} />
    </form>
  );
}
