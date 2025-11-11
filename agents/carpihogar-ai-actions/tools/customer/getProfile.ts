import { prisma } from '../../lib/db';
import { log } from '../../lib/logger';

export async function run(input: { userId?: string; email?: string }) {
  try {
    const where: any = input?.userId ? { id: String(input.userId) } : (input?.email ? { email: String(input.email).toLowerCase() } : null);
    if (!where) return { success: false, message: 'Debes indicar userId o email', data: null };
    const user = await prisma.user.findFirst({ where, select: { id: true, email: true, name: true, phone: true, role: true } });
    if (!user) return { success: false, message: 'Cliente no encontrado', data: null };
    log('mcp.customer.getProfile', { id: user.id });
    return { success: true, message: 'OK', data: user };
  } catch (e: any) {
    return { success: false, message: 'No se pudo obtener el perfil', data: null };
  }
}

