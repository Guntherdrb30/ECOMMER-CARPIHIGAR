'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getProducts(filters?: { isNew?: boolean; categorySlug?: string; q?: string; supplierId?: string }) {
    const where: any = {};

    if (filters?.isNew) {
        where.isNew = true;
    }

    if (filters?.categorySlug) {
        where.category = {
            slug: filters.categorySlug,
        };
    }

    if (filters?.q) {
        where.name = { contains: filters.q, mode: 'insensitive' };
    }
    if (filters?.supplierId) {
        where.supplierId = filters.supplierId;
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            category: true,
            supplier: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return products;
}

export async function createProduct(data: any) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    const product = await prisma.product.create({ data });
    revalidatePath('/dashboard/admin/productos');
    return product;
}

export async function updateProduct(id: string, data: any) {
    const product = await prisma.product.update({
        where: { id },
        data,
    });
    revalidatePath('/dashboard/admin/productos');
    return product;
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } });
    revalidatePath('/dashboard/admin/productos');
}

export async function deleteProductByForm(formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    const id = String(formData.get('id'));
    const secret = String(formData.get('secret') || '');
    const { getDeleteSecret } = await import('@/server/actions/settings');
    const configured = await getDeleteSecret();
    if (!configured) {
        redirect('/dashboard/admin/productos?message=&error=Falta%20configurar%20la%20clave%20de%20eliminaci%C3%B3n');
    }
    if (secret !== configured) {
        redirect('/dashboard/admin/productos?message=&error=Clave%20secreta%20inv%C3%A1lida');
    }
    await deleteProduct(id);
    redirect('/dashboard/admin/productos?message=Producto%20eliminado');
}

export async function updateProductInline(formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    const id = String(formData.get('id'));
    const priceUSD = formData.get('priceUSD');
    const priceAllyUSD = formData.get('priceAllyUSD');
    const stock = formData.get('stock');
    const isNew = formData.get('isNew');
    const image = String(formData.get('image') || '').trim();

    const data: any = {};
    if (priceUSD !== null) data.priceUSD = parseFloat(String(priceUSD));
    if (priceAllyUSD !== null && String(priceAllyUSD).length) data.priceAllyUSD = parseFloat(String(priceAllyUSD));
    if (stock !== null) data.stock = parseInt(String(stock), 10);
    if (isNew !== null) data.isNew = String(isNew) === 'on' || String(isNew) === 'true';
    if (image) data.images = { push: image } as any;

    await prisma.product.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'PRODUCT_UPDATE_INLINE', details: id } });
    revalidatePath('/dashboard/admin/productos');
    redirect('/dashboard/admin/productos?message=Producto%20actualizado');
}

export async function createStockMovement(formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    const productId = String(formData.get('productId'));
    const type = String(formData.get('type')) as 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    const quantity = parseInt(String(formData.get('quantity') || '0'), 10);
    const reason = String(formData.get('reason') || '');

    if (!['ENTRADA','SALIDA','AJUSTE'].includes(type) || !quantity) {
        throw new Error('Invalid movement');
    }

    await prisma.stockMovement.create({
        data: { productId, type: type as any, quantity, reason, userId: (session?.user as any)?.id },
    });

    // apply stock change
    await prisma.product.update({
        where: { id: productId },
        data: {
            stock: {
                increment: type === 'ENTRADA' ? quantity : type === 'SALIDA' ? -quantity : 0,
            },
        },
    });
    await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'STOCK_MOVE_'+type, details: `${productId}:${quantity}:${reason}` } });

    revalidatePath('/dashboard/admin/productos');
}

export async function getStockMovements(productId: string, take = 20) {
    const moves = await prisma.stockMovement.findMany({ where: { productId }, orderBy: { createdAt: 'desc' }, take });
    return moves;
}

export async function getProductById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    return product;
}

export async function updateProductFull(formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    const id = String(formData.get('id'));
    const name = String(formData.get('name') || '');
    const slug = String(formData.get('slug') || '');
    const description = String(formData.get('description') || '');
    const brand = String(formData.get('brand') || '').trim();
    const sku = String(formData.get('sku') || '') || null;
    const priceUSD = parseFloat(String(formData.get('priceUSD') || '0'));
    const priceAllyUSD = formData.get('priceAllyUSD') ? parseFloat(String(formData.get('priceAllyUSD'))) : null;
    const stock = parseInt(String(formData.get('stock') || '0'), 10);
    const categoryId = String(formData.get('categoryId') || '' ) || null;
    const supplierId = String(formData.get('supplierId') || '' ) || null;
    const isNew = String(formData.get('isNew') || '') === 'on' || String(formData.get('isNew') || '') === 'true';

    // Images handling
    const replaceAll = String(formData.get('replaceAllImages') || '') === 'on' || String(formData.get('replaceAllImages') || '') === 'true';
    const mainImageUpload = String(formData.get('mainImage') || '').trim();
    const extraImages = (formData.getAll('images[]') as string[]).filter(Boolean);

    const current = replaceAll ? [] : ((await prisma.product.findUnique({ where: { id }, select: { images: true } }))?.images || []);
    let images: string[] = [...current];
    if (mainImageUpload) {
        images = [mainImageUpload, ...images.filter((i) => i !== mainImageUpload)];
    }
    if (extraImages.length) {
        images = images.concat(extraImages);
    }
    images = images.filter(Boolean).slice(0, 4);

    const product = await prisma.product.update({
        where: { id },
        data: { name, slug, description, sku, brand, priceUSD, priceAllyUSD, stock, categoryId, supplierId, isNew, images },
    });
    await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'PRODUCT_UPDATE_FULL', details: id } });
    revalidatePath('/dashboard/admin/productos');
    redirect('/dashboard/admin/productos?message=Producto%20actualizado');
}

export async function getProductPageData(slug: string) {
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!product || !settings) {
    return { product: null, settings: null, relatedProducts: [] };
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: {
        not: product.id,
      },
    },
    include: {
      category: true,
    },
    take: 10,
  });

  const serializableProduct = {
    ...product,
    priceUSD: product.priceUSD.toNumber(),
    priceAllyUSD: product.priceAllyUSD?.toNumber() || null,
    avgCost: product.avgCost?.toNumber() || null,
    lastCost: product.lastCost?.toNumber() || null,
  };

  const serializableSettings = {
    ...settings,
    ivaPercent: settings.ivaPercent.toNumber(),
    tasaVES: settings.tasaVES.toNumber(),
    sellerCommissionPercent: settings.sellerCommissionPercent.toNumber(),
  };

  const serializableRelatedProducts = relatedProducts.map((p) => ({
    ...p,
    priceUSD: p.priceUSD.toNumber(),
    priceAllyUSD: p.priceAllyUSD?.toNumber() || null,
    avgCost: p.avgCost?.toNumber() || null,
    lastCost: p.lastCost?.toNumber() || null,
  }));

  return {
    product: serializableProduct,
    settings: serializableSettings,
    relatedProducts: serializableRelatedProducts,
  };
}