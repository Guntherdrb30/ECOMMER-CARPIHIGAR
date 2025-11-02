"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ShippingStatus, ShippingCarrier } from "@prisma/client";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type ShippingUpdatePayload = {
    orderId: string;
    carrier: ShippingCarrier;
    tracking: string;
    status: ShippingStatus;
    observations: string;
};

export async function saveShippingDetails(payload: ShippingUpdatePayload) {
    const { orderId, ...data } = payload;

    const result = await prisma.shipping.upsert({
        where: {
            orderId: orderId,
        },
        create: {
            orderId: orderId,
            carrier: data.carrier,
            tracking: data.tracking || "",
            status: data.status || 'PENDIENTE',
            observations: data.observations || "",
        },
        update: {
            carrier: data.carrier,
            tracking: data.tracking || "",
            status: data.status,
            observations: data.observations || "",
        },
    });

    // If marked delivered in admin, also close the order
    try {
        if (result.status === 'ENTREGADO') {
            await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETADO' as any } });
        }
    } catch {}

    revalidatePath('/dashboard/admin/envios');
    try { revalidatePath('/dashboard/admin/envios/online'); } catch {}
    try { revalidatePath('/dashboard/admin/envios/tienda'); } catch {}
    try { revalidatePath('/dashboard/cliente/envios'); } catch {}
    
    return { success: true, data: result };
}

export async function claimDelivery(orderId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!userId || role !== 'DELIVERY') throw new Error('Not authorized');
    // City guard: only allow Barinas deliveries
    const order_check = await prisma.order.findUnique({ where: { id: orderId }, include: { shippingAddress: true } });
    const city = String(order_check?.shippingAddress?.city || '').toLowerCase();
    if (city !== 'barinas') throw new Error('Not authorized for this city');
    const updated = await prisma.shipping.updateMany({
        where: { orderId, carrier: 'DELIVERY' as any, assignedToId: null },
        data: { assignedToId: userId, assignedAt: new Date() as any, status: 'EN_TRANSITO' as any, deliveryFeeUSD: 3 as any },
    });
    if (updated.count === 0) throw new Error('Already assigned');
    try { await prisma.auditLog.create({ data: { userId, action: 'DELIVERY_ASSIGNED', details: orderId } }); } catch {}
    try { revalidatePath('/dashboard/delivery'); } catch {}
    try { revalidatePath('/dashboard/admin/envios'); } catch {}
}

export async function completeDelivery(orderId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!userId || role !== 'DELIVERY') throw new Error('Not authorized');
    const s = await prisma.shipping.findUnique({ where: { orderId } });
    if (!s || s.assignedToId !== userId) throw new Error('Not yours');
    // City guard: only allow Barinas deliveries
    const order_check2 = await prisma.order.findUnique({ where: { id: orderId }, include: { shippingAddress: true } });
    const city2 = String(order_check2?.shippingAddress?.city || '').toLowerCase();
    if (city2 !== 'barinas') throw new Error('Not authorized for this city');
    await prisma.shipping.update({ where: { orderId }, data: { status: 'ENTREGADO' as any } });
    try { await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETADO' as any } }); } catch {}
    try { await prisma.auditLog.create({ data: { userId, action: 'DELIVERY_COMPLETED', details: orderId } }); } catch {}
    try { revalidatePath('/dashboard/delivery'); } catch {}
    try { revalidatePath('/dashboard/admin/envios'); } catch {}
    try { revalidatePath('/dashboard/cliente/envios'); } catch {}
}


