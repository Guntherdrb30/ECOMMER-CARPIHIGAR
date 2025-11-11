import * as ProductsSearch from '@/agents/carpihogar-ai-actions/tools/products/searchProducts';
import * as ProductsGet from '@/agents/carpihogar-ai-actions/tools/products/getProduct';
import * as CartAdd from '@/agents/carpihogar-ai-actions/tools/cart/addToCart';
import * as CartRemove from '@/agents/carpihogar-ai-actions/tools/cart/removeFromCart';
import * as CartView from '@/agents/carpihogar-ai-actions/tools/cart/viewCart';
import * as CartUpdateQty from '@/agents/carpihogar-ai-actions/tools/cart/updateQty';
import * as CustomerGetProfile from '@/agents/carpihogar-ai-actions/tools/customer/getProfile';
import * as CustomerSaveAddress from '@/agents/carpihogar-ai-actions/tools/customer/saveAddress';
import * as CustomerListAddresses from '@/agents/carpihogar-ai-actions/tools/customer/listAddresses';
import * as OrderCreate from '@/agents/carpihogar-ai-actions/tools/order/createOrder';
import * as OrderSavePaymentProof from '@/agents/carpihogar-ai-actions/tools/order/savePaymentProof';
import * as OrderSendToken from '@/agents/carpihogar-ai-actions/tools/order/sendToken';
import * as OrderValidateToken from '@/agents/carpihogar-ai-actions/tools/order/validateToken';
import * as ShippingGetOptions from '@/agents/carpihogar-ai-actions/tools/shipping/getShippingOptions';
import * as ShippingEstimateETA from '@/agents/carpihogar-ai-actions/tools/shipping/estimateETA';
import * as ShippingTrackOrder from '@/agents/carpihogar-ai-actions/tools/shipping/trackOrder';
import * as VoiceTTS from '@/agents/carpihogar-ai-actions/tools/voice/tts';
import * as VoiceSTT from '@/agents/carpihogar-ai-actions/tools/voice/stt';
import * as WhatsAppSendMessage from '@/agents/carpihogar-ai-actions/tools/whatsapp/sendMessage';

export type ToolDef = {
  name: string;
  description?: string;
  inputSchema: any;
  run: (input: any) => Promise<any>;
};

// Minimal schemas to guide callers; underlying tools validate internamente.
export const tools: ToolDef[] = [
  { name: 'products.search', description: 'Buscar productos por texto', inputSchema: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] }, run: ProductsSearch.run as any },
  { name: 'products.get', description: 'Obtener detalle de producto', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, run: ProductsGet.run as any },

  { name: 'cart.add', description: 'Agregar producto al carrito', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, quantity: { type: 'number' }, customerId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['productId'] }, run: CartAdd.run as any },
  { name: 'cart.remove', description: 'Eliminar producto del carrito', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, customerId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['productId'] }, run: CartRemove.run as any },
  { name: 'cart.updateQty', description: 'Actualizar cantidad en carrito', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, quantity: { type: 'number' }, customerId: { type: 'string' }, sessionId: { type: 'string' } }, required: ['productId','quantity'] }, run: CartUpdateQty.run as any },
  { name: 'cart.view', description: 'Ver carrito', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, sessionId: { type: 'string' } } }, run: CartView.run as any },

  { name: 'customer.getProfile', description: 'Perfil del cliente', inputSchema: { type: 'object', properties: { userId: { type: 'string' } } }, run: CustomerGetProfile.run as any },
  { name: 'customer.saveAddress', description: 'Guardar dirección', inputSchema: { type: 'object', additionalProperties: true }, run: CustomerSaveAddress.run as any },
  { name: 'customer.listAddresses', description: 'Listar direcciones', inputSchema: { type: 'object', properties: { userId: { type: 'string' } } }, run: CustomerListAddresses.run as any },

  { name: 'order.create', description: 'Crear orden', inputSchema: { type: 'object', properties: { customerId: { type: 'string' } } }, run: OrderCreate.run as any },
  { name: 'order.savePaymentProof', description: 'Guardar soporte de pago', inputSchema: { type: 'object', properties: { orderId: { type: 'string' }, method: { type: 'string' }, currency: { type: 'string' }, reference: { type: 'string' } }, required: ['orderId'] }, run: OrderSavePaymentProof.run as any },
  { name: 'order.sendToken', description: 'Enviar token de confirmación', inputSchema: { type: 'object', properties: { orderId: { type: 'string' }, phone: { type: 'string' } }, required: ['orderId','phone'] }, run: OrderSendToken.run as any },
  { name: 'order.validateToken', description: 'Validar token de confirmación', inputSchema: { type: 'object', properties: { orderId: { type: 'string' }, token: { type: 'string' }, confirmText: { type: 'string' } }, required: ['orderId','token'] }, run: OrderValidateToken.run as any },

  { name: 'shipping.getOptions', description: 'Opciones de envío', inputSchema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] }, run: ShippingGetOptions.run as any },
  { name: 'shipping.estimateETA', description: 'Estimación de entrega', inputSchema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] }, run: ShippingEstimateETA.run as any },
  { name: 'shipping.track', description: 'Tracking de envío', inputSchema: { type: 'object', properties: { orderId: { type: 'string' }, shipmentId: { type: 'string' } } }, run: ShippingTrackOrder.run as any },

  { name: 'voice.tts', description: 'Texto a voz (url)', inputSchema: { type: 'object', properties: { text: { type: 'string' }, voice: { type: 'string' } }, required: ['text'] }, run: VoiceTTS.run as any },
  { name: 'voice.stt', description: 'Voz a texto', inputSchema: { type: 'object', properties: { audioUrl: { type: 'string' } }, required: ['audioUrl'] }, run: VoiceSTT.run as any },

  { name: 'whatsapp.sendMessage', description: 'Enviar mensaje WhatsApp (ManyChat)', inputSchema: { type: 'object', additionalProperties: true }, run: WhatsAppSendMessage.run as any },
];

export function listTools() {
  return tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}

export async function callTool(name: string, input: any) {
  const t = tools.find(x => x.name === name);
  if (!t) return { success: false, message: `Tool not found: ${name}` };
  try {
    const res = await t.run(input ?? {});
    return { success: !!res?.success || true, result: res };
  } catch (e: any) {
    return { success: false, message: String(e?.message || e) };
  }
}
