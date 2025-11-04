import { sendReceiptEmail } from './email';

export async function sendReceiptEmailByForm(formData: FormData) {
  'use server';
  try {
    const orderId = String(formData.get('orderId') || '').trim();
    const to = String(formData.get('to') || '').trim();
    const tipoRaw = String(formData.get('tipo') || 'recibo').toLowerCase();
    const monedaRaw = String(formData.get('moneda') || 'USD').toUpperCase();
    const tipo = (['recibo','nota','factura'].includes(tipoRaw) ? (tipoRaw as 'recibo'|'nota'|'factura') : 'recibo');
    const moneda = (monedaRaw === 'VES' ? 'VES' : 'USD') as 'USD'|'VES';
    if (!orderId || !to) return;
    await sendReceiptEmail(orderId, to, tipo, moneda);
  } catch {}
}

