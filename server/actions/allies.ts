'use server';

import prisma from '@/lib/prisma';

export async function getTopAllies() {
  const allies = await prisma.user.findMany({
    where: {
      role: 'ALIADO',
    },
    include: {
      orders: {
        where: {
          status: {
            in: ['COMPLETADO', 'PAGADO'],
          },
        },
        select: {
          totalUSD: true,
        },
      },
    },
  });

  const alliesWithTotalSales = allies.map(ally => {
    const totalSales = ally.orders.reduce((sum, order) => sum + Number(order.totalUSD), 0);
    return {
      id: ally.id,
      name: ally.name,
      totalSales,
    };
  });

  const sortedAllies = alliesWithTotalSales.sort((a, b) => b.totalSales - a.totalSales);

  return sortedAllies.slice(0, 5);
}

export type AllySummary = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  services: string[];
  totalRevenueUSD: number;
  ordersCount: number;
};

// Ranking por ventas de aliados (como vendedores), opcionalmente filtrado por nombre/servicios
export async function getAlliesRanking(q?: string, limit = 10): Promise<AllySummary[]> {
  // Si no hay query, hacemos un groupBy global por sellerId
  if (!q || !q.trim()) {
    const groups = await prisma.order.groupBy({
      by: ['sellerId'],
      where: { sellerId: { not: null }, status: { in: ['PAGADO', 'COMPLETADO'] as any } },
      _sum: { totalUSD: true },
      _count: { _all: true },
      orderBy: { _sum: { totalUSD: 'desc' } },
      take: limit,
    });
    const ids = groups.map(g => String(g.sellerId));
    const users = await prisma.user.findMany({
      where: { id: { in: ids }, role: 'ALIADO' as any },
      select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, bio: true, services: true },
    });
    const map = new Map(users.map(u => [u.id, u]));
    return groups.map(g => {
      const u = map.get(String(g.sellerId));
      return {
        id: String(g.sellerId),
        name: u?.name || null,
        email: u?.email || null,
        phone: (u as any)?.phone || null,
        profileImageUrl: (u as any)?.profileImageUrl || null,
        bio: (u as any)?.bio || null,
        services: Array.isArray((u as any)?.services) ? ((u as any)?.services as string[]) : [],
        totalRevenueUSD: Number(g._sum.totalUSD || 0),
        ordersCount: Number(g._count._all || 0),
      } as AllySummary;
    }).filter(a => !!a.name);
  }

  // Con query: buscar usuarios aliados por nombre/bio/servicios/email y computar sus métricas
  const qq = q.trim();
  const users = await prisma.user.findMany({
    where: {
      role: 'ALIADO' as any,
      alliedStatus: 'APPROVED' as any,
      OR: [
        { name: { contains: qq, mode: 'insensitive' } },
        { email: { contains: qq, mode: 'insensitive' } },
        { bio: { contains: qq, mode: 'insensitive' } },
        { services: { has: qq } },
      ],
    },
    select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, bio: true, services: true },
    take: 50,
  });
  const ids = users.map(u => u.id);
  if (ids.length === 0) return [];
  const agg = await prisma.order.groupBy({
    by: ['sellerId'],
    where: { sellerId: { in: ids }, status: { in: ['PAGADO', 'COMPLETADO'] as any } },
    _sum: { totalUSD: true },
    _count: { _all: true },
  });
  const metric = new Map(agg.map(a => [String(a.sellerId), a]));
  const out: AllySummary[] = users.map(u => {
    const m = metric.get(u.id);
    return {
      id: u.id,
      name: u.name || null,
      email: u.email || null,
      phone: (u as any)?.phone || null,
      profileImageUrl: (u as any)?.profileImageUrl || null,
      bio: (u as any)?.bio || null,
      services: Array.isArray((u as any)?.services) ? ((u as any)?.services as string[]) : [],
      totalRevenueUSD: Number(m?._sum.totalUSD || 0),
      ordersCount: Number(m?._count._all || 0),
    } as AllySummary;
  });
  return out.sort((a, b) => b.totalRevenueUSD - a.totalRevenueUSD).slice(0, limit);
}

export async function getAllyPublicProfile(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, profileImageUrl: true,
      bio: true, services: true, portfolioUrls: true, portfolioText: true,
    },
  });
  if (!u) return null;
  const projects = await prisma.allyProject.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: { id: true, images: true, videoUrl: true, caption: true, createdAt: true },
  });
  const agg = await prisma.order.groupBy({
    by: ['sellerId'],
    where: { sellerId: id, status: { in: ['PAGADO', 'COMPLETADO'] as any } },
    _sum: { totalUSD: true },
    _count: { _all: true },
  }).catch(() => [] as any[]);
  const m = Array.isArray(agg) && agg.length ? agg[0] : undefined;
  return {
    ...u,
    projects,
    totalRevenueUSD: Number(m?._sum?.totalUSD || 0),
    ordersCount: Number(m?._count?._all || 0),
  } as any;
}
