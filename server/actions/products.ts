'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateEan13, normalizeBarcode } from '@/lib/barcode';
import { getSettings } from '@/server/actions/settings';

function parseCsvSimple(text: string, delimiter?: string): Array<Record<string,string>> {
    const dl = delimiter && delimiter.length ? delimiter : (text.indexOf(';') > -1 ? ';' : ',');
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (!lines.length) return [];
    const header = lines[0];
    const headers: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < header.length; i++) {
        const ch = header[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (!inQ && ch === dl) { headers.push(cur.trim()); cur = ''; }
        else { cur += ch; }
    }
    headers.push(cur.trim());
    const rows: Array<Record<string,string>> = [];
    for (let li = 1; li < lines.length; li++) {
        const line = lines[li]; cur=''; inQ=false; const cols: string[]=[];
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQ = !inQ; continue; }
            if (!inQ && ch === dl) { cols.push(cur); cur=''; }
            else { cur += ch; }
        }
        cols.push(cur);
        const rec: Record<string,string> = {};
        for (let i=0;i<headers.length;i++) { rec[headers[i]] = (cols[i] ?? '').trim(); }
        rows.push(rec);
    }
    return rows;
}

function pick(obj: Record<string,string>, names: string[]): string | undefined {
    for (const n of names) {
        const k = Object.keys(obj).find(h => h.toLowerCase().replace(/\s+/g,'') === n.toLowerCase().replace(/\s+/g,''));
        if (k && obj[k]) return obj[k];
    }
    return undefined;
}

export async function importProductsCsv(formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
    const file = formData.get('file') as unknown as File | null;
    if (!file) throw new Error('Archivo CSV requerido');
    const delimiter = String(formData.get('delimiter') || '') || undefined;
    const defaultSupplierId = String(formData.get('supplierId') || '') || undefined;

    const text = await (file as any).text();
    const rows = parseCsvSimple(text, delimiter);
    if (!rows.length) throw new Error('CSV vacío');

    const settings = await getSettings();
    const defClient = Number((settings as any).defaultMarginClientPct ?? 40);
    const defAlly = Number((settings as any).defaultMarginAllyPct ?? 30);
    const defWholesale = Number((settings as any).defaultMarginWholesalePct ?? 20);

    for (const r of rows) {
        const name = (pick(r, ['name','producto','product']) || '').trim();
        if (!name) continue;
        const code = pick(r, ['code','sku','codigo','código']) || null;
        const barcodeIn = pick(r, ['barcode','ean','ean13']) || '';
        const barcode = normalizeBarcode(barcodeIn || '') || null;
        const brand = pick(r, ['brand','marca']) || 'Sin marca';
        const description = pick(r, ['description','descripcion','descripción']) || '';
        const categorySlug = pick(r, ['category','categoria','categoría','categorySlug']) || '';
        const supplierId = (pick(r, ['supplierId','proveedorId']) || defaultSupplierId || '') || undefined;
        const stockStr = pick(r, ['stock','existencia','cantidad']) || '0';
        const costStr = pick(r, ['costUSD','costo','costoUSD']) || '';
        const priceStr = pick(r, ['priceUSD','precio','precioUSD']) || '';
        const imagesStr = pick(r, ['images','imagenes','imágenes']) || '';
        const images = imagesStr ? imagesStr.split(/[|;,\s]+/g).map(s => s.trim()).filter(Boolean).slice(0,4) : [];
        const stock = Number(String(stockStr).replace(',','.')) || 0;
        const costUSD = costStr ? Number(String(costStr).replace(',','.')) : undefined;
        let priceUSD = priceStr ? Number(String(priceStr).replace(',','.')) : undefined;
        let priceAllyUSD: number | undefined = undefined;
        let priceWholesaleUSD: number | undefined = undefined;
        let marginClientPct = defClient;
        let marginAllyPct = defAlly;
        let marginWholesalePct = defWholesale;
        if (typeof costUSD === 'number' && !isNaN(costUSD)) {
            priceUSD = Number((costUSD * (1 + marginClientPct/100)).toFixed(2));
            priceAllyUSD = Number((costUSD * (1 + marginAllyPct/100)).toFixed(2));
            priceWholesaleUSD = Number((costUSD * (1 + marginWholesalePct/100)).toFixed(2));
        }

        // Find existing
        let product = null as any;
        if (code) {
            const digits = code.replace(/\D/g,'');
            product = await prisma.product.findFirst({ where: { OR: [ { sku: code }, { code: code }, ...(digits.length>=6 ? [{ barcode: digits }] : []) ] } });
        }
        if (!product) {
            product = await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
        }

        const data: any = {
            name,
            brand,
            description: description || null,
            images,
            sku: code || null,
            code: code || null,
            barcode: barcode || null,
            stock,
            supplierId: supplierId || null,
        };
        if (categorySlug) {
            try {
                const cat = await prisma.category.findFirst({ where: { slug: categorySlug } });
                if (cat) data.categoryId = cat.id;
            } catch {}
        }
        if (typeof costUSD === 'number' && !isNaN(costUSD)) {
            data.costUSD = costUSD as any;
            data.lastCost = costUSD as any;
            data.avgCost = costUSD as any;
            data.marginClientPct = marginClientPct as any;
            data.marginAllyPct = marginAllyPct as any;
            data.marginWholesalePct = marginWholesalePct as any;
        }
        if (typeof priceUSD === 'number' && !isNaN(priceUSD)) {
            data.priceUSD = priceUSD as any;
            data.priceClientUSD = priceUSD as any;
            if (typeof priceAllyUSD === 'number') data.priceAllyUSD = priceAllyUSD as any;
            if (typeof priceWholesaleUSD === 'number') data.priceWholesaleUSD = priceWholesaleUSD as any;
        }

        if (product) {
            await prisma.product.update({ where: { id: product.id }, data });
        } else {
            const slug = (pick(r, ['slug']) || `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Math.random().toString(36).slice(2,7)}`).replace(/^-+|-+$/g,'');
            await prisma.product.create({ data: { ...data, slug } });
        }
    }
    revalidatePath('/dashboard/admin/productos');
    return { ok: true } as any;
}

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

    try {
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
        return products.map(p => ({
            ...p,
            priceUSD: p.priceUSD.toNumber(),
            priceAllyUSD: p.priceAllyUSD?.toNumber() || null,
            avgCost: p.avgCost?.toNumber() || null,
            lastCost: p.lastCost?.toNumber() || null,
        }));
    } catch (err) {
        console.warn('[getProducts] DB not reachable or query failed. Returning empty list.', err);
        return [] as any[];
    }
}

export async function createProduct(data: any) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    let barcode: string | undefined = normalizeBarcode(data?.barcode);
    if (!barcode) {
        // generate unique barcode
        for (let i = 0; i < 5; i++) {
            const candidate = generateEan13('200');
            const exists = await prisma.product.findFirst({ where: { barcode: candidate }, select: { id: true } });
            if (!exists) { barcode = candidate; break; }
        }
    }
    const product = await prisma.product.create({ data: { ...data, barcode } });
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

export async function updateProductBarcodeByForm(formData: FormData) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }
    const id = String(formData.get('id') || '');
    const generate = String(formData.get('generate') || '').toLowerCase();
    const input = String(formData.get('barcode') || '');
    let newBarcode: string | undefined = undefined;
    if (generate === '1' || generate === 'true' || generate === 'on') {
        for (let i = 0; i < 5; i++) {
            const candidate = generateEan13('200');
            const exists = await prisma.product.findFirst({ where: { barcode: candidate }, select: { id: true } });
            if (!exists) { newBarcode = candidate; break; }
        }
    } else {
        newBarcode = normalizeBarcode(input);
    }
    if (!newBarcode) {
        redirect('/dashboard/admin/productos?error=C%C3%B3digo%20inv%C3%A1lido');
    }
    const conflict = await prisma.product.findFirst({ where: { barcode: newBarcode!, NOT: { id } }, select: { id: true } });
    if (conflict) {
        redirect('/dashboard/admin/productos?error=C%C3%B3digo%20ya%20en%20uso');
    }
    await prisma.product.update({ where: { id }, data: { barcode: newBarcode } });
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'PRODUCT_BARCODE_SET', details: `${id}:${newBarcode}` } }); } catch {}
    revalidatePath('/dashboard/admin/productos');
    redirect('/dashboard/admin/productos?message=C%C3%B3digo%20actualizado');
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
