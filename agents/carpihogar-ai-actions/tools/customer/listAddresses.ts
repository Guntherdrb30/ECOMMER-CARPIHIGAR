import { prisma } from '../../lib/db';
import { log } from '../../lib/logger';

export async function run(input: { userId?: string; email?: string }) {
  try {
    let userId = input?.userId || '';
    if (!userId && input?.email) {
      const user = await prisma.user.findUnique({ where: { email: String(input.email).toLowerCase() } });
      userId = user?.id || '';
    }
    if (!userId) return { success: false, message: 'Debes indicar userId o email', data: [] };
    const list = await prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    log('mcp.customer.listAddresses', { userId, count: list.length });
    return { success: true, message: `OK (${list.length})`, data: list };
  } catch {
    return { success: false, message: 'No se pudieron listar direcciones', data: [] };
  }
}

