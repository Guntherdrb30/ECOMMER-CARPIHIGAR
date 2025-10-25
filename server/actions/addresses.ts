'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const AddressSchema = z.object({
  id: z.string().optional(),
  fullname: z.string().min(3, 'El nombre completo es requerido'),
  phone: z.string().min(7, 'El teléfono es requerido'),
  state: z.string().min(3, 'El estado es requerido'),
  city: z.string().min(3, 'La ciudad es requerida'),
  zone: z.string().optional(),
  address1: z.string().min(5, 'La dirección es requerida'),
  address2: z.string().optional(),
  notes: z.string().optional(),
});

export async function getMyAddresses() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return [];
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];

  return prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
}

export async function saveAddress(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error('User not found');

  const str = (v: any): string => (typeof v === 'string' ? v : '');
  const opt = (v: any): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s ? s : undefined;
  };

  const rawData = {
    id: opt(formData.get('id')),
    fullname: str(formData.get('fullname')),
    phone: str(formData.get('phone')),
    state: str(formData.get('state')),
    city: str(formData.get('city')),
    zone: opt(formData.get('zone')),
    address1: str(formData.get('address1')),
    address2: opt(formData.get('address2')),
    notes: opt(formData.get('notes')),
  };

  const validation = AddressSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: validation.error.issues.map(e => e.message).join('\n') };
  }

  const { id, ...data } = validation.data;

  try {
    if (id) {
      // Update
      await prisma.address.update({
        where: { id, userId: user.id }, // Ensure user can only update their own address
        data,
      });
    } else {
      // Create
      await prisma.address.create({
        data: { ...data, userId: user.id },
      });
    }
    try { revalidatePath('/dashboard/cliente/direcciones', 'page' as any); } catch { revalidatePath('/dashboard/cliente/direcciones'); }
    return { success: true, message: 'Dirección guardada con éxito.' };
  } catch (error) {
    return { success: false, message: 'Error al guardar la dirección.' };
  }
}

export async function deleteAddress(addressId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error('User not found');

  try {
    await prisma.address.delete({
      where: { id: addressId, userId: user.id }, // Ensure user can only delete their own address
    });
    try { revalidatePath('/dashboard/cliente/direcciones', 'page' as any); } catch { revalidatePath('/dashboard/cliente/direcciones'); }
    return { success: true, message: 'Dirección eliminada con éxito.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar la dirección.' };
  }
}

export async function saveAddressFromCheckout(formData: FormData) {
  await saveAddress(formData);
  const next = (formData.get('next') as string) || '/checkout/revisar';
  redirect(next);
}

export async function deleteAddressAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'ID inválido' } as any;
  return deleteAddress(id);
}


export async function deleteAddressSA(_prevState: any, formData: FormData) {
  return deleteAddressAction(formData);
}



export async function saveAddressSA(_prevState: any, formData: FormData) {
  return saveAddress(formData);
}

// Admin/Vendedor/Aliado: listar direcciones por userId (para presupuestos/ventas offline)
export async function getAddressesByUserId(userId: string) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  if (!['ADMIN','VENDEDOR','ALIADO'].includes(role)) throw new Error('Not authorized');
  if (!userId) return [];
  return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function getLatestAddressByUserId(userId: string) {
  const addrs = await getAddressesByUserId(userId);
  return addrs[0] || null;
}

