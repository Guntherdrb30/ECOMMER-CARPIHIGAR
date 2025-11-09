export async function initiateManualPayment(input: { orderId: string; method?: string }) {
  const methods = [
    'Pago Móvil',
    'Transferencia Bancaria',
    'Zelle',
    'Pago en Tienda',
  ];
  const instructions = [
    { method: 'Pago Móvil', text: 'Banco X, Tel: 0412-0000000, RIF J-00000000-0' },
    { method: 'Transferencia Bancaria', text: 'Banco Y, Cuenta 0102-0000-00-0000000000, RIF J-00000000-0' },
    { method: 'Zelle', text: 'payments@carpihogar.com' },
    { method: 'Pago en Tienda', text: 'Visítanos en nuestra sucursal para pagar en caja' },
  ];
  const chosen = input.method ? methods.find(m => m.toLowerCase().includes(String(input.method).toLowerCase())) : undefined;
  if (chosen) {
    const row = instructions.find(i => i.method === chosen);
    return { methods, chosen, instructions: row ? [row.text] : [] };
  }
  return { methods, instructions: instructions.map(i => `${i.method}: ${i.text}`) };
}
