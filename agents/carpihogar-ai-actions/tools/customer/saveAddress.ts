import { prisma } from '../../lib/db';
import { log } from '../../lib/logger';
import { ensureId, ensurePhone, sanitizeText } from '../../lib/validate';

type Structured = { fullname?: string; phone?: string; state?: string; city?: string; zone?: string; address1?: string; address2?: string; notes?: string };

export async function run(input: { userId: string; addressText?: string; addressJson?: Structured }) {
  try {
    const userId = ensureId(input?.userId, 'userId');
    let a: Structured = input?.addressJson || {};
    if ((!a || !a.address1) && input?.addressText) {
      const txt = sanitizeText(input.addressText, 500);
      a = { fullname: 'Cliente', phone: '', state: '', city: '', zone: '', address1: txt };
    }
    if (!a || !a.address1) return { success: false, message: 'Falta dirección', data: null };
    const phone = a.phone ? ensurePhone(a.phone) : '';
    const created = await prisma.address.create({ data: {
      userId, fullname: a.fullname || 'Cliente', phone, state: a.state || '', city: a.city || '', zone: a.zone || null as any,
      address1: a.address1 || '', address2: a.address2 || null as any, notes: a.notes || null as any,
    } });
    log('mcp.customer.saveAddress', { userId, addressId: created.id });
    return { success: true, message: 'Dirección guardada', data: created };
  } catch (e: any) {
    return { success: false, message: String(e?.message || 'No se pudo guardar la dirección'), data: null };
  }
}

