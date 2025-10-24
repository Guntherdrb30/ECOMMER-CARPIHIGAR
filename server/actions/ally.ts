'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getMySalesAsAlly() {
  const session = await getServerSession(authOptions);
  const myId = String((session?.user as any)?.id || '');
  if (!myId || (session?.user as any)?.role !== 'ALIADO') throw new Error('Not authorized');
  const orders = await prisma.order.findMany({
    where: { sellerId: myId },
    include: { user: true, items: { include: { product: true } }, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
}

export async function getAllyKpis() {
  const session = await getServerSession(authOptions);
  const myId = String((session?.user as any)?.id || '');
  if (!myId || (session?.user as any)?.role !== 'ALIADO') throw new Error('Not authorized');
  const orders = await prisma.order.findMany({ where: { sellerId: myId }, include: { items: { include: { product: true } } } });
  const totalRevenueUSD = orders.reduce((a, o) => a + Number(o.totalUSD || 0), 0);
  let totalProfitUSD = 0;
  for (const o of orders) {
    for (const it of o.items) {
      const p2 = it.product?.priceAllyUSD != null ? Number(it.product.priceAllyUSD) : null;
      const unit = Number(it.priceUSD || 0);
      const qty = Number(it.quantity || 0);
      // Profit per item: sold price - ally base price (if available)
      const cost = p2 != null ? p2 : unit; // if no ally price configured, assume no profit difference
      const gain = Math.max(0, unit - cost) * qty;
      totalProfitUSD += gain;
    }
  }
  const ordersCount = orders.length;
  return { totalRevenueUSD, totalProfitUSD, ordersCount };
}

export async function getAllySalesSeries(range?: { from?: string; to?: string }) {
  const session = await getServerSession(authOptions);
  const myId = String((session?.user as any)?.id || '');
  if (!myId || (session?.user as any)?.role !== 'ALIADO') throw new Error('Not authorized');
  const now = new Date();
  const to = range?.to ? new Date(range.to) : now;
  const from = range?.from ? new Date(range.from) : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const fromDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0));
  const toDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59));
  const orders = await prisma.order.findMany({
    where: { sellerId: myId, createdAt: { gte: fromDay, lte: toDay } },
    select: { createdAt: true, totalUSD: true },
    orderBy: { createdAt: 'asc' },
  });
  const map = new Map<string, { date: string; revenueUSD: number; orders: number }>();
  for (const o of orders) {
    const d = new Date(o.createdAt as any);
    const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10);
    if (!map.has(key)) map.set(key, { date: key, revenueUSD: 0, orders: 0 });
    const rec = map.get(key)!;
    rec.revenueUSD += Number(o.totalUSD || 0);
    rec.orders += 1;
  }
  const days: Array<{ date: string; revenueUSD: number; orders: number }>=[];
  for (let t = fromDay.getTime(); t <= toDay.getTime(); t += 24*60*60*1000) {
    const d = new Date(t);
    const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10);
    days.push(map.get(key) || { date: key, revenueUSD: 0, orders: 0 });
  }
  return days;
}

export async function getAllyTopProducts(range?: { from?: string; to?: string }, limit = 10) {
  const session = await getServerSession(authOptions);
  const myId = String((session?.user as any)?.id || '');
  if (!myId || (session?.user as any)?.role !== 'ALIADO') throw new Error('Not authorized');
  const now = new Date();
  const to = range?.to ? new Date(range.to) : now;
  const from = range?.from ? new Date(range.from) : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const fromDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0));
  const toDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59));
  const items = await prisma.orderItem.findMany({
    where: { order: { sellerId: myId, createdAt: { gte: fromDay, lte: toDay } } },
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
}
