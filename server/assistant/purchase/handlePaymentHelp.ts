export async function handlePaymentHelp({
  paymentMethod,
  message,
}: {
  paymentMethod?: string;
  message?: string;
}) {
  const raw = String(paymentMethod || message || '').toLowerCase();

  let method: 'ZELLE' | 'PAGO_MOVIL' | 'TRANSFERENCIA' | 'OTRO' = 'OTRO';
  if (/zelle/.test(raw)) method = 'ZELLE';
  else if (/pago m[oó]vil|pago movil|pago-m[oó]vil/.test(raw)) method = 'PAGO_MOVIL';
  else if (/transferenc/i.test(raw)) method = 'TRANSFERENCIA';

  const messages: any[] = [];

  if (method === 'ZELLE') {
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Perfecto, podemos usar Zelle. El pago se hace en dólares a la cuenta Zelle de Carpihogar. En la pantalla de pago verás el correo o teléfono exacto al que debes enviar.',
    });
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Después de hacer el pago por Zelle, vuelve a este chat y adjunta una foto del comprobante (desde el botón de adjuntar imagen). Yo leeré los datos del soporte y registraré tu pago para revisión.',
    });
  } else if (method === 'PAGO_MOVIL') {
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Con pago móvil, el monto se paga en bolívares. El sistema te mostrará el equivalente en VES según la tasa del día y los datos del banco, cédula y teléfono para hacer el pago móvil.',
    });
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Cuando completes el pago móvil, puedes subir una foto del comprobante aquí en el asistente. Yo extraeré el monto y la referencia para enviarlo a revisión.',
    });
  } else if (method === 'TRANSFERENCIA') {
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Si prefieres transferencia bancaria, en el checkout verás los datos de las cuentas de Carpihogar. Podrás hacer la transferencia en la moneda correspondiente y luego registrar el pago.',
    });
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Al igual que con los otros métodos, después de transferir puedes adjuntar el comprobante aquí para que quede registrado y pase a revisión.',
    });
  } else {
    messages.push({
      role: 'assistant',
      type: 'text',
      content:
        'Manejamos métodos como Zelle, pago móvil y transferencia bancaria. Dime cuál prefieres y te explico paso a paso cómo usarlo.',
    });
  }

  messages.push({
    role: 'assistant',
    type: 'text',
    content:
      'Si todavía no revisaste tu carrito, puedo recordarte el resumen. Y cuando estés listo, desde “Proceder a pagar” verás los datos exactos para el método que elijas.',
  });

  return { messages, uiActions: [] as any[] };
}

