export const copy = {
  cart: 'Perfecto, aquí tienes tu carrito. ¿Deseas usar una dirección existente o agregar una nueva?',
  addressSuggest: (alias: string) => `¿Usamos la dirección ${alias} o prefieres agregar otra?`,
  shipping: (eta: string) => `Estas son las mejores opciones de envío para tu ciudad. Estimado de llegada ${eta}.`,
  summary: (items: string, total: string) => `Revisemos tu pedido: ${items}, total ${total}. Si estás de acuerdo, te envío un código por WhatsApp para confirmar.`,
  tokenSent: 'Listo. Te envié un código a tu WhatsApp. Escríbelo aquí o responde “Sí, autorizo la compra” por WhatsApp.',
  tokenOk: '¡Perfecto! Autorización confirmada ✅. Elige tu método de pago y registra el comprobante para completar.',
  paymentReceived: '¡Gracias! Recibimos tu comprobante. Te avisaremos apenas verifiquemos tu pago.',
};
