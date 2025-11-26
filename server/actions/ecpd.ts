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
  Array<{ id: string; name: string; slug: string; isConfigurable: boolean; configSchema: any | null }>
> {
  const products = await prisma.product.findMany({
    where: {},
    select: {
      id: true,
      name: true,
      slug: true,
      isConfigurable: true,
      configSchema: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => ({
    ...p,
    configSchema: (p as any).configSchema ?? null,
  }));
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

