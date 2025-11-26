'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

type EcpdConfig = {
  name: string;
  schema: any;
};

export async function getConfigurableProducts(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    isConfigurable: boolean;
    configSchema: any | null;
    images: string[];
    priceUSD: number | null;
  }>
> {
  const products = await prisma.product.findMany({
    where: { isConfigurable: true },
    select: {
      id: true,
      name: true,
      slug: true,
      isConfigurable: true,
      configSchema: true,
      images: true,
      priceUSD: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => ({
    ...p,
    configSchema: (p as any).configSchema ?? null,
    images: Array.isArray((p as any).images) ? ((p as any).images as string[]) : [],
    priceUSD:
      typeof (p as any).priceUSD === 'number'
        ? ((p as any).priceUSD as number)
        : (p as any).priceUSD?.toNumber?.() ?? null,
  }));
}

export async function getConfigurableProductBySlug(slug: string) {
  const p = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      images: true,
      priceUSD: true,
      isConfigurable: true,
      configSchema: true,
    },
  });
  if (!p || !p.isConfigurable) return null;
  return {
    ...p,
    images: Array.isArray((p as any).images) ? ((p as any).images as string[]) : [],
    priceUSD:
      typeof (p as any).priceUSD === 'number'
        ? ((p as any).priceUSD as number)
        : (p as any).priceUSD?.toNumber?.() ?? null,
    configSchema: (p as any).configSchema ?? null,
  };
}

export async function setProductEcpdConfig(productId: string, config: EcpdConfig | null) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const data: any = {};
  if (config === null) {
    data.isConfigurable = false;
    data.configSchema = null;
  } else {
    data.isConfigurable = true;
    data.configSchema = config.schema ?? {};
  }

  await prisma.product.update({
    where: { id: productId },
    data,
  });

  revalidatePath('/dashboard/admin/productos/configurables');
}
