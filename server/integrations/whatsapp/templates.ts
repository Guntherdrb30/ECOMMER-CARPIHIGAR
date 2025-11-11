export const TEMPLATES = {
  CONFIRMATION_TOKEN: (token: string) => `Carpihogar IA: Para confirmar tu compra envía este código aquí en el chat: *${token}*. Válido por 10 minutos.`,
  ORDER_PAID: '✅ Pago recibido. Estamos preparando tu pedido.',
  SHIPMENT_CREATED: (provider: string, tracking?: string) => `📦 Tu pedido fue despachado. Proveedor: ${provider}${tracking ? ` · Tracking: ${tracking}` : ''}`,
  SHIPMENT_STATUS: (status: string, eta?: string) => {
    const map: Record<string,string> = {
      preparing: 'Estamos empaquetando tu pedido ✨',
      waiting_driver: 'Tu pedido está listo para ser retirado 🚚',
      assigned: 'Tu pedido fue asignado a despacho ✅',
      in_route: `🚚 En camino ${eta ? '→ ETA ' + eta : ''}`,
      delivered: '¡Tu pedido fue entregado! ✅ Gracias por confiar en Carpihogar.',
      incident: '⚠️ Hubo una incidencia. Estamos solucionando.',
    };
    return map[status] || 'Te mantenemos informado sobre tu envío.';
  },
  CANCEL_REQUEST: 'Tu solicitud de cancelación fue registrada y el equipo la revisará.',
  DELIVERY_PROOF: 'Gracias por recibir tu pedido. ¡Disfrútalo!',
  DEFAULT_REPLY: 'Gracias por escribirnos. ¿En qué podemos ayudarte?'
};
