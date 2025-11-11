import { prisma } from '../../lib/db';
import { log } from '../../lib/logger';

export async function run(input: { id?: string; slug?: string }) {
  const { id, slug } = input || {} as any;
  if (!id && !slug) return { success: false, message: 'Debes indicar id o slug', data: null };
  try {
    const product = await prisma.product.findFirst({ where: id ? ({ id }) as any : ({ slug: String(slug) }) as any });
    if (!product) return { success: false, message: 'Producto no encontrado', data: null };
    log('mcp.products.get', { id: product.id, slug: product.slug });
    return { success: true, message: 'OK', data: product };
  } catch (e: any) {
    log('mcp.products.get.error', { id, slug, error: String(e?.message || e) }, 'error');
    return { success: false, message: 'No se pudo obtener el producto', data: null };
  }
}

