export async function initiateManualPayment(input: { orderId: string }) {
  const methods = [
    'Pago Móvil',
    'Transferencia Bancaria',
    'Zelle',
    'Pago en Tienda',
  ];
  const instructions = [
    'Pago Móvil: Banco X, Tel: 0412-0000000, RIF J-00000000-0',
    'Transferencia: Banco Y, Cuenta 0102-0000-00-0000000000, RIF J-00000000-0',
    'Zelle: payments@carpihogar.com',
    'En Tienda: Visítanos en nuestra sucursal para pagar en caja',
  ];
  return { methods, instructions };
}

