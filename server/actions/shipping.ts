"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ShippingStatus, ShippingCarrier } from "@prisma/client";

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

    revalidatePath('/dashboard/admin/envios');
    try { revalidatePath('/dashboard/admin/envios/online'); } catch {}
    try { revalidatePath('/dashboard/admin/envios/tienda'); } catch {}
    
    return { success: true, data: result };
}
