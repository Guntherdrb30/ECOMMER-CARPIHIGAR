import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as CartAdd from '@/agents/carpihogar-ai-actions/tools/cart/addToCart';
import * as CartRemove from '@/agents/carpihogar-ai-actions/tools/cart/removeFromCart';
import * as CartUpdateQty from '@/agents/carpihogar-ai-actions/tools/cart/updateQty';
import * as CartView from '@/agents/carpihogar-ai-actions/tools/cart/viewCart';
import * as SaveAddress from '@/agents/carpihogar-ai-actions/tools/customer/saveAddress';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || body?.action || '').toLowerCase();
  const payload = body?.payload || {};
  const session = await getServerSession(authOptions);
  const customerId = (session?.user as any)?.id as string | undefined;
  try {
    if (key === 'add_to_cart') {
      const productId = String(payload?.productId || body?.productId || '');
      const quantity = Number(payload?.quantity || body?.qty || 1);
      const r = await CartAdd.run({ customerId, productId, quantity });
      const cart = await CartView.run({ customerId });
      return NextResponse.json({ success: r.success, message: r.message, data: cart?.data || {} });
    }
    if (key === 'view_cart') {
      const cart = await CartView.run({ customerId });
      return NextResponse.json(cart);
    }
    if (key === 'remove_from_cart') {
      const productId = String(payload?.productId || body?.productId || '');
      const r = await CartRemove.run({ customerId, productId });
      const cart = await CartView.run({ customerId });
      return NextResponse.json({ success: r.success, message: r.message, data: cart?.data || {} });
    }
    if (key === 'update_qty') {
      const productId = String(payload?.productId || body?.productId || '');
      const quantity = Number(payload?.quantity || body?.qty || 1);
      const r = await CartUpdateQty.run({ customerId, productId, quantity });
      const cart = await CartView.run({ customerId });
      return NextResponse.json({ success: r.success, message: r.message, data: cart?.data || {} });
    }
    if (key === 'save_address') {
      const r = await SaveAddress.run(payload);
      return NextResponse.json(r);
    }
    return NextResponse.json({ success: false, message: 'Acción no soportada', data: null }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: String(e?.message || e) }, { status: 500 });
  }
}
