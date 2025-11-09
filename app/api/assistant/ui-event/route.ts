import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as Agent from '@/agents/carpihogar-customer-assistant';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || '');
  const session = await getServerSession(authOptions);
  const customerId = (session?.user as any)?.id as string | undefined;
  try {
    if (key === 'add_to_cart') {
      const productId = String(body?.productId || '');
      const qty = Number(body?.qty || 1);
      const add = (Agent as any).CartAdd?.addToCart;
      const view = (Agent as any).CartView?.viewCart;
      if (typeof add === 'function') await add({ customerId, productId, qty });
      const cart = typeof view === 'function' ? await view({ customerId }) : undefined;
      return NextResponse.json({ ok: true, cart: cart?.cart });
    }
    if (key === 'start_checkout') {
      const create = (Agent as any).OrdersCreateDraft?.createOrderDraft;
      const token = (Agent as any).OrdersGenerateToken?.generateConfirmationToken;
      if (typeof create === 'function') {
        const r = await create({ customerId });
        if (r?.ok && typeof token === 'function') await token({ orderId: r.order.id });
        return NextResponse.json({ ok: !!r?.ok, order: r?.order || null });
      }
      return NextResponse.json({ ok: false });
    }
    if (key === 'choose_payment_method') {
      const method = String(body?.method || '');
      const latest = (Agent as any).OrdersCreateDraft?.createOrderDraft; // fallback if no order exists
      const pay = (Agent as any).OrdersInitiatePayment?.initiateManualPayment;
      // find latest order awaiting payment, otherwise create
      // We don't have a tool to fetch latest order id here; rely on initiateManualPayment without order
      if (typeof pay === 'function') {
        const r = await pay({ orderId: 'latest', method });
        return NextResponse.json({ ok: true, order: r });
      }
      return NextResponse.json({ ok: false });
    }
    if (key === 'view_cart') {
      const view = (Agent as any).CartView?.viewCart;
      const cart = typeof view === 'function' ? await view({ customerId }) : undefined;
      return NextResponse.json({ ok: true, cart: cart?.cart });
    }
    if (key === 'remove_from_cart') {
      const productId = String(body?.productId || '');
      const remove = (Agent as any).CartRemove?.removeFromCart;
      const view = (Agent as any).CartView?.viewCart;
      if (typeof remove === 'function') await remove({ customerId, productId });
      const cart = typeof view === 'function' ? await view({ customerId }) : undefined;
      return NextResponse.json({ ok: true, cart: cart?.cart });
    }
    if (key === 'update_qty') {
      const productId = String(body?.productId || '');
      const qty = Number(body?.qty || 0);
      const upd = (Agent as any).CartUpdateQty?.updateCartQty;
      const view = (Agent as any).CartView?.viewCart;
      if (typeof upd === 'function') await upd({ customerId, productId, qty });
      const cart = typeof view === 'function' ? await view({ customerId }) : undefined;
      return NextResponse.json({ ok: true, cart: cart?.cart });
    }
    // Extend with more actions (remove_from_cart, start_checkout, etc.)
    return NextResponse.json({ ok: true, key });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
