import * as CartView from '@/agents/carpihogar-ai-actions/tools/cart/viewCart';
import * as ListAddresses from '@/agents/carpihogar-ai-actions/tools/customer/listAddresses';
import * as GetShippingOptions from '@/agents/carpihogar-ai-actions/tools/shipping/getShippingOptions';
import * as EstimateETA from '@/agents/carpihogar-ai-actions/tools/shipping/estimateETA';
import * as CreateOrder from '@/agents/carpihogar-ai-actions/tools/order/createOrder';
import * as SendToken from '@/agents/carpihogar-ai-actions/tools/order/sendToken';
import * as ValidateToken from '@/agents/carpihogar-ai-actions/tools/order/validateToken';

type Context = { customerId?: string; sessionId?: string };

export async function runPurchaseFlowStep(step: string, context: Context, input: any) {
  const act = String(step || '').toLowerCase();
  try {
    if (act === 'start') {
      const cart = await CartView.run({ customerId: context.customerId, sessionId: context.sessionId } as any);
      return {
        success: true,
        state: 'pending_confirmation',
        message: 'Carrito listo',
        ui: { type: 'ui_control', action: 'show_cart', payload: cart?.data || {} },
        cart: cart?.data || null,
      };
    }
    if (act === 'ensureaddress') {
      const addrs = await ListAddresses.run({ userId: context.customerId } as any);
      return {
        success: true,
        message: 'Direcciones',
        ui: { type: 'ui_control', action: 'open_address_form', payload: { addresses: addrs?.data || [] } },
        address: addrs?.data || [],
      };
    }
    if (act === 'shipping') {
      const opts = await GetShippingOptions.run({ city: String(input?.city || '') } as any);
      const eta = await EstimateETA.run({ city: String(input?.city || '') } as any);
      return { success: true, message: 'Opciones de envío', ui: { type: 'ui_control', action: 'show_shipping', payload: { options: opts?.data || [], eta: eta?.data || {} } } } as any;
    }
    if (act === 'createorder') {
      const o = await CreateOrder.run({ customerId: context.customerId } as any);
      return { success: true, state: 'pending_confirmation', message: 'Orden creada', order: o?.data || null, ui: { type: 'ui_control', action: 'show_order_summary', payload: o?.data || {} } } as any;
    }
    if (act === 'sendtoken') {
      const res = await SendToken.run({ orderId: String(input?.orderId || ''), phone: String(input?.phone || '') });
      return { success: !!res?.success, message: res?.message || 'Token enviado', ui: { type: 'ui_control', action: 'await_token', payload: {} } } as any;
    }
    if (act === 'validatetoken') {
      const r = await ValidateToken.run({ orderId: String(input?.orderId || ''), token: String(input?.token || ''), confirmText: String(input?.confirmText || '') });
      if (r?.success) {
        return { success: true, state: 'awaiting_payment', message: 'Autorización confirmada', ui: { type: 'ui_control', action: 'show_payment_methods', payload: {} } } as any;
      }
      return { success: false, message: r?.message || 'Token inválido' } as any;
    }
    if (act === 'submitpayment') {
      return { success: true, state: 'payment_pending_review', message: 'Pago enviado', ui: { type: 'ui_control', action: 'payment_submitted', payload: {} } } as any;
    }
    return { success: true, message: 'OK' } as any;
  } catch (e: any) {
    return { success: false, message: 'No se pudo procesar el flujo' } as any;
  }
}

