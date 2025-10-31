'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { confirmOrderAction } from '@/server/actions/orders';
import ProductCard from '@/components/product-card';
import PaymentInstructions from '@/components/payment-instructions';
import { useCartStore } from '@/store/cart';

type PaymentMethod = 'PAGO_MOVIL' | 'TRANSFERENCIA' | 'ZELLE';
type PaymentCurrency = 'USD' | 'VES';
type ShippingOption = '' | 'RETIRO_TIENDA' | 'DELIVERY';
type ShippingCarrier = '' | 'TEALCA' | 'MRW';
type Address = { id: string; fullname: string; phone: string; state: string; city: string; zone?: string | null; address1: string; address2?: string | null; notes?: string | null };

function formatUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVES(n: number) {
  return 'Bs.S. ' + n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="order-90 w-full bg-brand text-white py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-60"
    >
      {pending ? 'Enviandoâ€¦' : 'Confirmar pago'}
    </button>
  );
}

export default function RevisarPage() {
  const items = useCartStore((s) => s.items);
  const getTotalUSD = useCartStore((s) => s.getTotalUSD);
  const clearCart = useCartStore((s) => s.clearCart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAGO_MOVIL');
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>('USD');
  const [shippingOption, setShippingOption] = useState<ShippingOption>('');
  const [shippingCarrier, setShippingCarrier] = useState<ShippingCarrier>('');
  const [detectedCity, setDetectedCity] = useState('');
  const [isLocalBarinas, setIsLocalBarinas] = useState(false);
  const [hasAddress, setHasAddress] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [topItems, setTopItems] = useState<any[]>([]);
  const [tasaTop, setTasaTop] = useState<number>(40);
  const searchParams = useSearchParams();
  const router = useRouter();

  // ConfiguraciÃ³n (puede venir de BD/ajustes si se requiere)
  const ivaPercent = 16; // %
  const tasaVES = 40; // tasa de ejemplo

  const subtotal = useMemo(() => getTotalUSD(), [getTotalUSD, items]);
  const iva = useMemo(() => subtotal * (ivaPercent / 100), [subtotal, ivaPercent]);
  const totalUSD = useMemo(() => subtotal + iva, [subtotal, iva]);
  const totalVES = useMemo(() => totalUSD * tasaVES, [totalUSD, tasaVES]);

  const initialState = { ok: false as boolean, error: '' as string };
  const [state, formAction] = useFormState(confirmOrderAction as any, initialState);
  const [errors, setErrors] = useState<{ reference?: string; pm_phone?: string; zelle_email?: string }>({});

  useEffect(() => {
    if (state?.ok) {
      clearCart();
    }
  }, [state?.ok, clearCart]);
  // Load top sold products for success screen
  useEffect(() => {
    let cancelled = false;
    if (!state?.ok) return;
    (async () => {
      try {
        const res = await fetch('/api/products/top-sold?limit=5', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setTopItems(Array.isArray(json?.items) ? json.items : []);
          if (typeof json?.tasaVES === 'number') setTasaTop(json.tasaVES);
        }
      } catch {}
    })();
    return () => { cancelled = true };
  }, [state?.ok]);

  // hydrate default selections from localStorage if available
  useEffect(() => {
    try {
      const savedMethod = localStorage.getItem('checkout.paymentMethod') as PaymentMethod | null;
      const savedCurrency = localStorage.getItem('checkout.paymentCurrency') as PaymentCurrency | null;
      const savedEntrega = localStorage.getItem('checkout.shippingOption') as ShippingOption | null;
      const savedCarrier = localStorage.getItem('checkout.shippingCarrier') as ShippingCarrier | null;
      if (savedMethod === 'PAGO_MOVIL' || savedMethod === 'TRANSFERENCIA' || savedMethod === 'ZELLE') {
        setPaymentMethod(savedMethod);
      }
      if (savedCurrency === 'USD' || savedCurrency === 'VES') {
        setPaymentCurrency(savedCurrency);
      }
      if (savedEntrega === 'RETIRO_TIENDA' || savedEntrega === 'DELIVERY' || savedEntrega === '') {
        setShippingOption(savedEntrega);
      }
      if (savedCarrier === 'TEALCA' || savedCarrier === 'MRW' || savedCarrier === '') {
        setShippingCarrier(savedCarrier);
      }
    } catch {}
  }, []);

  // read querystring (?moneda=USD|VES, ?metodo=...)
  useEffect(() => {
    if (!searchParams) return;
    const qMoneda = (searchParams.get('moneda') || '').toUpperCase();
    if (qMoneda === 'USD' || qMoneda === 'VES') {
      setPaymentCurrency(qMoneda as PaymentCurrency);
      try { localStorage.setItem('checkout.paymentCurrency', qMoneda); } catch {}
    }
    const qMetodo = (searchParams.get('metodo') || '').toUpperCase();
    if (qMetodo === 'PAGO_MOVIL' || qMetodo === 'TRANSFERENCIA' || qMetodo === 'ZELLE') {
      setPaymentMethod(qMetodo as PaymentMethod);
      try { localStorage.setItem('checkout.paymentMethod', qMetodo); } catch {}
    }
    const qEntrega = (searchParams.get('entrega') || '').toUpperCase();
    if (qEntrega === 'RETIRO_TIENDA' || qEntrega === 'DELIVERY' || qEntrega === '') {
      setShippingOption(qEntrega as ShippingOption);
      try { localStorage.setItem('checkout.shippingOption', qEntrega); } catch {}
    }
    const qCarrier = (searchParams.get('carrier') || '').toUpperCase();
    if (qCarrier === 'TEALCA' || qCarrier === 'MRW' || qCarrier === '') {
      setShippingCarrier(qCarrier as ShippingCarrier);
      try { localStorage.setItem('checkout.shippingCarrier', qCarrier); } catch {}
    }
  }, [searchParams]);

  // keep URL in sync when currency changes (for shareable links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(searchParams?.toString());
      if (paymentCurrency) params.set('moneda', paymentCurrency);
      if (shippingOption !== undefined) params.set('entrega', shippingOption);
      if (shippingCarrier !== undefined) params.set('carrier', shippingCarrier);
      const url = `${location.pathname}?${params.toString()}`;
      router.replace(url);
    } catch {}
  }, [paymentCurrency, shippingOption, shippingCarrier]);

  // keep URL in sync when payment method changes and persist
  useEffect(() => {
    try {
      const params = new URLSearchParams(searchParams?.toString());
      if (paymentMethod) params.set('metodo', paymentMethod);
      const url = `${location.pathname}?${params.toString()}`;
      router.replace(url);
      localStorage.setItem('checkout.paymentMethod', paymentMethod);
    } catch {}
  }, [paymentMethod]);

  // Ensure selected method is valid for chosen currency
  useEffect(() => {
    const allowed: PaymentMethod[] = (paymentCurrency === 'USD')
      ? ['ZELLE','TRANSFERENCIA']
      : ['PAGO_MOVIL','TRANSFERENCIA'];
    if (!allowed.includes(paymentMethod)) {
      setPaymentMethod(allowed[0]);
    }
  }, [paymentCurrency]);

  // Hide non-applicable payment method options in the dropdown
  useEffect(() => {
    try {
      const sel = document.getElementById('paymentMethod') as HTMLSelectElement | null;
      if (!sel) return;
      const allowed = new Set(paymentCurrency === 'USD' ? ['ZELLE','TRANSFERENCIA'] : ['PAGO_MOVIL','TRANSFERENCIA']);
      for (const opt of Array.from(sel.options)) {
        const ok = allowed.has(String(opt.value || '').toUpperCase());
        (opt as any).hidden = !ok;
        opt.disabled = !ok;
      }
      if (!allowed.has(String(sel.value || '').toUpperCase())) {
        const firstOk = Array.from(sel.options).find(o => !(o as any).hidden);
        if (firstOk) setPaymentMethod(firstOk.value as any);
      }
    } catch {}
  }, [paymentCurrency]);

  // Hide irrelevant shipping inputs (local vs nacional)
  useEffect(() => {
    try {
      const labelCarrier = document.querySelector('label[for="shippingCarrier"]') as HTMLElement | null;
      const labelOption = document.querySelector('label[for="shippingOption"]') as HTMLElement | null;
      if (labelCarrier) labelCarrier.style.display = isLocalBarinas ? 'none' : '';
      if (labelOption) labelOption.style.display = isLocalBarinas ? '' : 'none';
    } catch {}
  }, [isLocalBarinas]);

  // Detect user location (Barinas) to show guidance
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me/location', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setDetectedCity(json.city || '');
          setIsLocalBarinas(!!json.isBarinas);
          setHasAddress(!!json.hasAddress);
        }
      } catch {}
    })();
    return () => { cancelled = true };
  }, []);

  // load user's saved addresses and hydrate selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/addresses/me', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setAddresses(json || []);
        setHasAddress((json || []).length > 0);
        // Pick from localStorage if valid, else first
        let saved = '';
        try { saved = localStorage.getItem('checkout.addressId') || ''; } catch {}
        const exists = (json || []).some((a: Address) => a.id === saved);
        const initial = exists ? saved : ((json && json[0]?.id) || '');
        setSelectedAddressId(initial);
      } catch {}
    })();
    return () => { cancelled = true };
  }, []);

  // persist selected address
  useEffect(() => {
    try { if (selectedAddressId) localStorage.setItem('checkout.addressId', selectedAddressId); } catch {}
  }, [selectedAddressId]);

  // If no address on file, redirect to Datos de Envío and come back after
  useEffect(() => {
    if (hasAddress === false) {
      try {
        const next = `${location.pathname}${location.search || ''}`;
        const params = new URLSearchParams();
        params.set('next', next);
        router.replace(`/checkout/datos-envio?${params.toString()}`);
      } catch {}
    }
  }, [hasAddress, router]);

  // persist shipping selections
  useEffect(() => {
    try { localStorage.setItem('checkout.shippingOption', shippingOption); } catch {}
  }, [shippingOption]);
  useEffect(() => {
    try { localStorage.setItem('checkout.shippingCarrier', shippingCarrier); } catch {}
  }, [shippingCarrier]);

  if (state?.ok) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Â¡Gracias!</h1>
          <p className="text-gray-700">Hemos recibido tu pago y estÃ¡ en revisiÃ³n.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Revisar orden</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Resumen de la orden</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.name} (x{item.quantity})
                </span>
                <span>{formatUSD(item.priceUSD * item.quantity)}</span>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatUSD(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({ivaPercent}%):</span>
              <span>{formatUSD(iva)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total (USD):</span>
              <span>{formatUSD(totalUSD)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total (VES):</span>
              <span>{formatVES(totalVES)}</span>
            </div>
          </div>
          {paymentCurrency === 'USD' && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
              Pagando en dólares obtienes un 25% de descuento.
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Pago</h2>

          <form action={formAction} className="flex flex-col space-y-4" onSubmit={(e) => {
            const next: any = {};
            const form = e.currentTarget as HTMLFormElement;
            const reference = (form.querySelector('#reference') as HTMLInputElement | null)?.value || '';
            const pmPhone = (form.querySelector('#pm_phone') as HTMLInputElement | null)?.value || '';
            const zellePayerName = (form.querySelector('#zelle_payer_name') as HTMLInputElement | null)?.value || '';
            if (!reference.trim()) next.reference = 'La referencia es obligatoria';
            if (paymentMethod === 'PAGO_MOVIL' && !pmPhone.trim()) next.pm_phone = 'El telÃ©fono es obligatorio';
            if (paymentMethod === 'ZELLE') {
              if (!zellePayerName.trim()) next.zelle_payer_name = 'El nombre del titular es obligatorio';
            }
            setErrors(next);
            if (Object.keys(next).length) e.preventDefault();
          }}>
            <div className="order-20">
  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Método de pago</label>
  <select
    id="paymentMethod"
    name="paymentMethod"
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
  >
    {paymentCurrency === 'USD' ? (
      <>
        <option value="ZELLE">Zelle</option>
        <option value="TRANSFERENCIA">Depósito en banco</option>
      </>
    ) : (
      <>
        <option value="PAGO_MOVIL">Pago Móvil</option>
        <option value="TRANSFERENCIA">Transferencia</option>
      </>
    )}
  </select>
            <PaymentInstructions method={paymentMethod} currency={paymentCurrency} />
</div>

            <div className="order-first">
              <label htmlFor="paymentCurrency" className="block text-sm font-medium text-gray-700">Moneda del pago</label>
              <select
                id="paymentCurrency"
                name="paymentCurrency"
                value={paymentCurrency}
                onChange={(e) => setPaymentCurrency(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="USD">USD</option>
                <option value="VES">Bs (VES)</option>
              </select>
            </div>

            {paymentMethod === 'PAGO_MOVIL' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">Realiza tu Pago MÃ³vil y coloca los datos:</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="pm_phone">Teléfono</label>
                  <input id="pm_phone" name="pm_phone" type="text" required inputMode="tel" pattern="[0-9+()\s-]{10,}" title="Ej: +58 412 1234567 o 0412-1234567" className={`mt-1 block w-full rounded-md shadow-sm ${errors.pm_phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`} />
                  {errors.pm_phone && <div className="text-xs text-red-600 mt-1">{errors.pm_phone}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="pm_payer_name">Nombre del titular</label>
                  <input id="pm_payer_name" name="pm_payer_name" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="pm_bank">Banco del titular</label>
                  <input id="pm_bank" name="pm_bank" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="reference">Referencia</label>
                  <input id="reference" name="reference" type="text" required className={`mt-1 block w-full rounded-md shadow-sm ${errors.reference ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`} />
                  {errors.reference && <div className="text-xs text-red-600 mt-1">{errors.reference}</div>}
                </div>
              </div>
            )}

            {/* Sección genérica de Transferencia removida */}

            {paymentMethod === 'ZELLE' && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">EnvÃ­a el pago por Zelle y coloca los datos:</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="zelle_email">Correo Zelle</label>
                  <input id="zelle_email" name="zelle_email" type="email" required className={`mt-1 block w-full rounded-md shadow-sm ${errors.zelle_email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`} />
                  {errors.zelle_email && <div className="text-xs text-red-600 mt-1">{errors.zelle_email}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="reference">Referencia</label>
                  <input id="reference" name="reference" type="text" required className={`mt-1 block w-full rounded-md shadow-sm ${errors.reference ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`} />
                  {errors.reference && <div className="text-xs text-red-600 mt-1">{errors.reference}</div>}
                </div>
              </div>
            )}

            {/* Campos adicionales según moneda y método */}
            {paymentMethod === 'ZELLE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="zelle_payer_name">Nombre del titular de la cuenta</label>
                  <input id="zelle_payer_name" name="zelle_payer_name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
            )}

            {paymentMethod === 'TRANSFERENCIA' && paymentCurrency === 'USD' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="deposit_bank">Banco</label>
                  <select id="deposit_bank" name="deposit_bank" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" defaultValue="">
                    <option value="" disabled>Selecciona banco</option>
                    <option value="BANESCO">Banesco</option>
                    <option value="MERCANTIL">Mercantil</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">Selecciona un banco para ver los datos de depósito y copiarlos.</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="deposit_payer_name">Nombre del depositante</label>
                  <input id="deposit_payer_name" name="deposit_payer_name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="deposit_payer_id">Cédula</label>
                  <input id="deposit_payer_id" name="deposit_payer_id" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
            )}

            {paymentMethod === 'TRANSFERENCIA' && paymentCurrency === 'VES' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="transfer_payer_name">Nombre del titular</label>
                  <input id="transfer_payer_name" name="transfer_payer_name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="transfer_payer_id">Cédula</label>
                  <input id="transfer_payer_id" name="transfer_payer_id" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="transfer_bank">Banco</label>
                  <select id="transfer_bank" name="transfer_bank" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" defaultValue="">
                    <option value="" disabled>Selecciona banco</option>
                    <option value="BANESCO">Banesco</option>
                    <option value="MERCANTIL">Mercantil</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">Selecciona un banco para ver los datos de transferencia y copiarlos.</div>
                </div>
              </div>
            )}

            {!hasAddress && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-800 rounded mb-3">
                AÃºn no has agregado una direcciÃ³n de envÃ­o. Por favor completa tus datos en
                <a className="underline ml-1" href="/checkout/datos-envio">Datos de EnvÃ­o</a>
                {" "}o en
                <a className="underline ml-1" href="/dashboard/cliente">Mi Cuenta</a> para evitar errores en la entrega.
              </div>
            )}

            {isLocalBarinas ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800 rounded">
                Detectamos ciudad {detectedCity || 'local'}. Puedes elegir Retiro en tienda o Delivery incluido.
              </div>
            ) : (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800 rounded">
                Para envÃ­os nacionales, puedes seleccionar TEALCA o MRW.
              </div>
            )}

            {/* Address selection */}
            <div className="order-40">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Dirección de envío</label>
                <a className="text-sm text-blue-600 underline" href="/checkout/datos-envio?next=/checkout/revisar">Añadir nueva</a>
              </div>
              {addresses.length === 0 ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-800 rounded mb-3">
                  Aún no tienes direcciones guardadas. Agrega una en Datos de Envío.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {addresses.map(a => (
                    <label key={a.id} className="flex items-start gap-3 p-2 border rounded cursor-pointer">
                      <input
                        type="radio"
                        name="addressRadio"
                        className="mt-1"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{a.fullname} • {a.phone}</div>
                        <div>{a.address1}{a.address2 ? `, ${a.address2}` : ''}</div>
                        <div>{a.zone ? `${a.zone}, ` : ''}{a.city}, {a.state}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="order-50">
              <label htmlFor="shippingOption" className="block text-sm font-medium text-gray-700">Entrega local (Barinas)</label>
              <select
                id="shippingOption"
                name="shippingOption"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={shippingOption}
                onChange={(e) => setShippingOption(e.target.value as ShippingOption)}
              >
                <option value="">AutomÃ¡tica</option>
                <option value="RETIRO_TIENDA">Retiro en tienda</option>
                <option value="DELIVERY">Delivery (incluido)</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">Si estÃ¡s en Barinas puedes elegir Retiro en tienda o Delivery incluido.</div>
            </div>

            <div className="order-50">
              <label htmlFor="shippingCarrier" className="block text-sm font-medium text-gray-700">Carrier (si no estÃ¡s en Barinas)</label>
              <select
                id="shippingCarrier" style={{ display: isLocalBarinas ? 'none' : 'block' }}
                name="shippingCarrier"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value as ShippingCarrier)}
                disabled={isLocalBarinas}
              >
                <option value="">AutomÃ¡tico</option>
                <option value="TEALCA">TEALCA</option>
                <option value="MRW">MRW</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">{isLocalBarinas ? 'No aplica para entregas locales.' : 'Para envÃ­os nacionales puedes elegir TEALCA o MRW.'}</div>
            </div>

            {/* Hidden payload */}
            <input type="hidden" name="items" value={JSON.stringify(items)} />
            <input type="hidden" name="tasaVES" value={String(tasaVES)} />
            <input type="hidden" name="ivaPercent" value={String(ivaPercent)} />
            <input type="hidden" name="paymentCurrency" value={paymentCurrency} />
            <input type="hidden" name="shippingAddressId" value={selectedAddressId} />

            {state?.error && (
              <div className="text-red-600 text-sm">{state.error}</div>
            )}

            <div className="text-sm text-gray-600">
              {paymentCurrency === 'USD' ? (
                <div>Total a pagar: $ {formatUSD(totalUSD)}</div>
              ) : (
                <div>Total a pagar: {formatVES(totalVES)}</div>
              )}
            </div>
            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}

