export const shippingMsg = {
  created: (provider: string, tracking?: string) => `¡Tu pedido ya está en preparación! Proveedor: ${provider}${tracking ? `, Tracking: ${tracking}` : ''}. Te avisaremos cuando salga a ruta.`,
  assigned: 'Tu pedido fue asignado para despacho.',
  in_route: (eta?: string) => `¡En camino! ETA ${eta || ''}.`,
  delivered: '¡Entregado! Gracias por comprar en Carpihogar.',
  incident: 'Tuvimos una incidencia y ya la estamos atendiendo. Te mantendremos informado.',
};
