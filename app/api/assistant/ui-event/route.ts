import { NextResponse } from 'next/server';
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
    // Extend with more actions (remove_from_cart, start_checkout, etc.)
    return NextResponse.json({ ok: true, key });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
