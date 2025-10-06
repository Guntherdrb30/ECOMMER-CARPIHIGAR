
'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import Price from '@/components/price';
import Link from 'next/link';

export default function Cart({ tasa }: { tasa: number }) {
  const { items, updateQty, removeItem, getTotalUSD } = useCartStore();
  const [moneda, setMoneda] = useState<'USD' | 'VES'>('USD');

  const total = getTotalUSD();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Tu Carrito está Vacío</h1>
        <p className="text-gray-600 mb-8">Parece que no has añadido nada a tu carrito todavía.</p>
        <Link href="/productos" className="bg-brand hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-full transition-colors">
          Ver Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Tu Carrito</h1>

      {/* Currency Switcher */}
      <div className="flex justify-end mb-4">
        <select
          value={moneda}
          onChange={(e) => setMoneda(e.target.value as 'USD' | 'VES')}
          className="border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
        >
          <option value="USD">USD</option>
          <option value="VES">VES</option>
        </select>
      </div>

      {/* Cart Items Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 font-bold">Producto</th>
              <th className="p-4 font-bold">Precio</th>
              <th className="p-4 font-bold">Cantidad</th>
              <th className="p-4 font-bold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-4">{item.name}</td>
                <td className="p-4">
                  <Price priceUSD={item.priceUSD} tasa={tasa} moneda={moneda} />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQty(item.id, parseInt(e.target.value, 10))}
                    className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                  />
                   <button onClick={() => removeItem(item.id)} className="ml-4 text-red-500 hover:text-red-700">X</button>
                </td>
                <td className="p-4 text-right">
                  <Price priceUSD={item.priceUSD * item.quantity} tasa={tasa} moneda={moneda} className="font-bold" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cart Total */}
      <div className="flex justify-end mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Total del Carrito</h2>
          <div className="flex justify-between items-center">
            <span className="text-lg">Total ({moneda})</span>
            <Price priceUSD={total} tasa={tasa} moneda={moneda} className="text-2xl font-bold text-brand" />
          </div>
          <Link href="/checkout/datos-envio" className="mt-6 w-full bg-brand hover:bg-opacity-90 text-white font-bold py-3 rounded-full transition-colors text-center block">
            Proceder al Pago
          </Link>
        </div>
      </div>
    </div>
  );
}
