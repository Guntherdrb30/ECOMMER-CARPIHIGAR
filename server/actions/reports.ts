'use server';

import prisma from '@/lib/prisma';

export type DateRange = { from?: string; to?: string };

function parseRange(range?: DateRange) {
  const now = new Date();
  const to = range?.to ? new Date(range.to) : now;
  const from = range?.from ? new Date(range.from) : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  // Normalize times to full-day boundaries
  const fromDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0));
  const toDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59));
  return { from: fromDay, to: toDay };
}

export async function getKpis(range?: DateRange) {
  try {
    const { from, to } = parseRange(range);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { totalUSD: true, status: true, saleType: true },
    });
    const totalRevenueUSD = orders.reduce((a, o) => a + Number(o.totalUSD || 0), 0);
    const ordersCount = orders.length;
    const avgOrderValueUSD = ordersCount ? totalRevenueUSD / ordersCount : 0;
    const paid = orders.filter(o => String(o.status) === 'PAGADO').length;
    const credit = orders.filter(o => String(o.saleType) === 'CREDITO').length;
    return {
      totalRevenueUSD,
      ordersCount,
      avgOrderValueUSD,
      paidOrders: paid,
      creditOrders: credit,
    };
  } catch (err) {
    console.warn('[getKpis] error', err);
    return { totalRevenueUSD: 0, ordersCount: 0, avgOrderValueUSD: 0, paidOrders: 0, creditOrders: 0 };
  }
}

export async function getSalesSeries(range?: DateRange) {
  try {
    const { from, to } = parseRange(range);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, totalUSD: true },
      orderBy: { createdAt: 'asc' },
    });
    const map = new Map<string, { date: string; revenueUSD: number; orders: number }>();
    for (const o of orders) {
      const d = new Date(o.createdAt as any);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map.has(key)) map.set(key, { date: key, revenueUSD: 0, orders: 0 });
      const rec = map.get(key)!;
      rec.revenueUSD += Number(o.totalUSD || 0);
      rec.orders += 1;
    }
    // Fill missing dates for continuity
    const days: Array<{ date: string; revenueUSD: number; orders: number }> = [];
    for (let t = from.getTime(); t <= to.getTime(); t += 24 * 60 * 60 * 1000) {
      const d = new Date(t);
      const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
      days.push(map.get(key) || { date: key, revenueUSD: 0, orders: 0 });
    }
    return days;
  } catch (err) {
    console.warn('[getSalesSeries] error', err);
    return [] as any[];
  }
}

export async function getTopProducts(range?: DateRange, limit = 10) {
  try {
    const { from, to } = parseRange(range);
    const items = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: from, lte: to } } },
      select: { productId: true, product: { select: { name: true, sku: true } }, priceUSD: true, quantity: true },
    });
    const agg = new Map<string, { name: string; sku: string | null; qty: number; revenueUSD: number }>();
    for (const it of items) {
      const key = it.productId;
      const unit = Number(it.priceUSD || 0);
      const rev = unit * Number(it.quantity || 0);
      if (!agg.has(key)) agg.set(key, { name: it.product?.name || 'Producto', sku: it.product?.sku || null, qty: 0, revenueUSD: 0 });
      const r = agg.get(key)!;
      r.qty += Number(it.quantity || 0);
      r.revenueUSD += rev;
    }
    return Array.from(agg.values()).sort((a, b) => b.revenueUSD - a.revenueUSD).slice(0, limit);
  } catch (err) {
    console.warn('[getTopProducts] error', err);
    return [] as any[];
  }
}

export async function getSalesByCategory(range?: DateRange, limit = 10) {
  try {
    const { from, to } = parseRange(range);
    const items = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: from, lte: to } } },
      select: { quantity: true, priceUSD: true, product: { select: { category: { select: { name: true } } } } },
    });
    const agg = new Map<string, { category: string; qty: number; revenueUSD: number }>();
    for (const it of items) {
      const cat = it.product?.category?.name || 'Sin categoría';
      const unit = Number(it.priceUSD || 0);
      const rev = unit * Number(it.quantity || 0);
      if (!agg.has(cat)) agg.set(cat, { category: cat, qty: 0, revenueUSD: 0 });
      const r = agg.get(cat)!;
      r.qty += Number(it.quantity || 0);
      r.revenueUSD += rev;
    }
    return Array.from(agg.values()).sort((a, b) => b.revenueUSD - a.revenueUSD).slice(0, limit);
  } catch (err) {
    console.warn('[getSalesByCategory] error', err);
    return [] as any[];
  }
}

export async function getSalesBySeller(range?: DateRange) {
  try {
    const { from, to } = parseRange(range);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { totalUSD: true, seller: { select: { id: true, name: true, email: true } } },
    });
    const agg = new Map<string, { seller: string; revenueUSD: number; orders: number }>();
    for (const o of orders) {
      const s = o.seller?.name || o.seller?.email || 'Sin vendedor';
      if (!agg.has(s)) agg.set(s, { seller: s, revenueUSD: 0, orders: 0 });
      const r = agg.get(s)!;
      r.revenueUSD += Number(o.totalUSD || 0);
      r.orders += 1;
    }
    return Array.from(agg.values()).sort((a, b) => b.revenueUSD - a.revenueUSD);
  } catch (err) {
    console.warn('[getSalesBySeller] error', err);
    return [] as any[];
  }
}

export async function getReceivablesAging() {
  try {
    const open = await prisma.receivable.findMany({
      where: { OR: [ { status: 'PENDIENTE' as any }, { status: 'PARCIAL' as any } ] },
      include: { order: true, entries: true, noteItems: true },
    });
    const today = new Date();
    const bucket = (days: number) => {
      if (days <= 0) return 'Al día';
      if (days <= 30) return '1-30';
      if (days <= 60) return '31-60';
      if (days <= 90) return '61-90';
      return '90+';
    };
    const agg = new Map<string, { bucket: string; count: number; totalUSD: number }>();
    for (const r of open) {
      const due = (r.dueDate || (r.order as any)?.creditDueDate) as Date | null;
      const days = due ? Math.floor((today.getTime() - new Date(due).getTime()) / (24 * 60 * 60 * 1000)) : 0;
      const b = bucket(days);
      if (!agg.has(b)) agg.set(b, { bucket: b, count: 0, totalUSD: 0 });
      const rec = agg.get(b)!;
      const totalUSD = Number(r.order?.totalUSD || 0);
      const abonadoUSD = (r.entries || []).reduce(
        (acc, e: any) => acc + Number(e.amountUSD || 0),
        0,
      );
      const notes = (r as any).noteItems || [];
      const creditsUSD = notes
        .filter((n: any) => String(n.type) === 'CREDITO')
        .reduce((acc: number, n: any) => acc + Number(n.amountUSD || 0), 0);
      const debitsUSD = notes
        .filter((n: any) => String(n.type) === 'DEBITO')
        .reduce((acc: number, n: any) => acc + Number(n.amountUSD || 0), 0);
      const adjustedTotalUSD = totalUSD + debitsUSD - creditsUSD;
      const saldoUSD = Math.max(0, adjustedTotalUSD - abonadoUSD);
      rec.count += 1;
      rec.totalUSD += saldoUSD;
    }
    const labels = ['Al día','1-30','31-60','61-90','90+'];
    const rows = labels.map(l => agg.get(l) || { bucket: l, count: 0, totalUSD: 0 });
    return rows;
  } catch (err) {
    console.warn('[getReceivablesAging] error', err);
    return [ 'Al día','1-30','31-60','61-90','90+' ].map(l => ({ bucket: l, count: 0, totalUSD: 0 }));
  }
}
