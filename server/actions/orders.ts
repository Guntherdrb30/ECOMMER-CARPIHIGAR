'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPayment } from './payments';
import type { Currency } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMyOrders(params?: { take?: number }) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
        throw new Error('Not authenticated');
    }

    const orders = await prisma.order.findMany({
        where: { userId },
        include: {
            items: true,
            payment: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: params?.take,
    });

    return orders;
}

export async function getAllOrders() {
    const session = await getServerSession(authOptions);

    if (((session?.user as any)?.role) !== 'ADMIN') {
        throw new Error('Not authorized');
    }

    const orders = await prisma.order.findMany({
        include: {
            items: true,
            user: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return orders;
}

export async function confirmOrderAction(_prevState: any, formData: FormData) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
        try { await prisma.auditLog.create({ data: { userId: undefined, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Not authenticated' } }); } catch {}
        return { ok: false, error: 'Not authenticated' };
    }

    try {
        const itemsJson = (formData.get('items') as string) || '[]';
        const items: Array<{ id: string; name: string; priceUSD: number; quantity: number }> = JSON.parse(itemsJson);

        if (!Array.isArray(items) || items.length === 0) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Cart is empty' } }); } catch {}
            return { ok: false, error: 'Cart is empty' };
        }

        const method = (formData.get('paymentMethod') as string) as any;
        const paymentCurrency = ((formData.get('paymentCurrency') as string) || 'USD').toUpperCase() as Currency;
        const reference = (formData.get('reference') as string) || undefined;
        const proofUrl = (formData.get('proofUrl') as string) || undefined;
        const pmPhone = (formData.get('pm_phone') as string) || '';
        const pmPayerName = (formData.get('pm_payer_name') as string) || '';
        const pmBank = (formData.get('pm_bank') as string) || '';
        const zelleEmail = (formData.get('zelle_email') as string) || '';
        const shippingOption = ((formData.get('shippingOption') as string) || '').toUpperCase();
        const shippingCarrier = ((formData.get('shippingCarrier') as string) || '').toUpperCase();
        const shippingAddressId = (formData.get('shippingAddressId') as string) || '';

        // Validations
        const validMethods = ['PAGO_MOVIL','TRANSFERENCIA','ZELLE'];
        if (!validMethods.includes(String(method))) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Invalid method' } }); } catch {}
            return { ok: false, error: 'Método de pago inválido' };
        }
        if (!reference || !reference.trim()) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Missing reference' } }); } catch {}
            return { ok: false, error: 'La referencia de pago es obligatoria' };
        }
        if (String(method) === 'PAGO_MOVIL' && !pmPhone.trim()) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Missing pm_phone' } }); } catch {}
            return { ok: false, error: 'Para Pago Móvil, el teléfono es obligatorio' };
        }
        if (String(method) === 'PAGO_MOVIL' && !pmPayerName.trim()) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Missing pm_payer_name' } }); } catch {}
            return { ok: false, error: 'Para Pago Móvil, el nombre del titular es obligatorio' };
        }
        if (String(method) === 'PAGO_MOVIL' && !pmBank.trim()) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Missing pm_bank' } }); } catch {}
            return { ok: false, error: 'Para Pago Móvil, el banco del titular es obligatorio' };
        }
        if (String(method) === 'ZELLE' && !zelleEmail.trim()) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_VALIDATION_FAILED', details: 'Missing zelle_email' } }); } catch {}
            return { ok: false, error: 'Para Zelle, el correo es obligatorio' };
        }

        const tasaVES = Number(formData.get('tasaVES') ?? 40);
        const ivaPercent = Number(formData.get('ivaPercent') ?? 16);

        // Resolve shipping address: selected by user or fallback to latest
        let selectedAddress: any = null;
        if (shippingAddressId) {
            selectedAddress = await prisma.address.findFirst({ where: { id: shippingAddressId, userId } });
        }
        if (!selectedAddress) {
            selectedAddress = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
        }
        if (!selectedAddress) {
            try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_VALIDATION_FAILED', details: 'No address on file' } }); } catch {}
            return { ok: false, error: 'Debes agregar una dirección de envío antes de confirmar.' };
        }

        const subtotalUSD = items.reduce((sum, it) => sum + (Number(it.priceUSD) * Number(it.quantity)), 0);
        const ivaAmount = subtotalUSD * (ivaPercent / 100);
        const totalUSD = subtotalUSD + ivaAmount;
        const totalVES = totalUSD * tasaVES;

        const order = await prisma.order.create({
            data: {
                userId,
                subtotalUSD,
                ivaPercent,
                tasaVES,
                totalUSD,
                totalVES,
                shippingAddressId: selectedAddress.id,
                items: {
                    create: items.map((it) => ({
                        productId: it.id,
                        name: it.name,
                        priceUSD: Number(it.priceUSD),
                        quantity: Number(it.quantity),
                    })),
                },
            },
        });

        await createPayment(order.id, method, reference, proofUrl, paymentCurrency, pmPayerName || undefined, pmPhone || undefined, pmBank || undefined);

        // Create shipping record for online order with default carrier logic
        try {
            const addr = selectedAddress;
            const isBarinas = !!addr && /barinas/i.test(String(addr.city || ''));
            let channel: any = isBarinas ? ('TIENDA' as any) : ('ONLINE' as any);
            let carrier: any = isBarinas ? ('RETIRO_TIENDA' as any) : ('TEALCA' as any);
            if (shippingOption === 'RETIRO_TIENDA' || shippingOption === 'DELIVERY') {
                channel = 'TIENDA' as any;
                carrier = shippingOption as any;
            } else if (!isBarinas) {
                if (shippingCarrier === 'TEALCA' || shippingCarrier === 'MRW') {
                    carrier = shippingCarrier as any;
                }
            }
            const observations = (channel === 'TIENDA') ? 'Cliente en Barinas: retiro en tienda o delivery incluido' : '';
            await prisma.shipping.create({
                data: {
                    orderId: order.id,
                    carrier,
                    tracking: '',
                    status: 'PENDIENTE' as any,
                    channel,
                    observations,
                },
            });
        } catch {}

        // Enviar recibo por email (deshabilitado por defecto, activar con EMAIL_ENABLED=true)
        if (process.env.EMAIL_ENABLED === 'true') {
            try {
                const { sendReceiptEmail } = await import('./email');
                const to = (session?.user as any)?.email as string | undefined;
                if (to) await sendReceiptEmail(order.id, to, 'recibo', paymentCurrency as any);
            } catch {}
        }

        return { ok: true, orderId: order.id };
    } catch (e) {
        try { await prisma.auditLog.create({ data: { userId, action: 'CHECKOUT_PAYMENT_ERROR', details: String(e) } }); } catch {}
        return { ok: false, error: 'Failed to confirm order' };
    }
}


export async function getMyOrderById(id: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
        throw new Error('Not authenticated');
    }
    const order = await prisma.order.findFirst({
        where: { id, userId },
        include: { items: true, payment: true, shipping: true, shippingAddress: true },
    });
    if (!order) throw new Error('Order not found');
    return order as any;
}

export async function getAllShippedOrders(query?: string) {
    const session = await getServerSession(authOptions);

    if (((session?.user as any)?.role) !== 'ADMIN') {
        throw new Error('Not authorized');
    }

    const whereClause: any = {
        shipping: {
            isNot: null
        },
    };

    if (query) {
        whereClause.OR = [
            { shipping: { tracking: { contains: query, mode: 'insensitive' } } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { shippingAddress: { city: { contains: query, mode: 'insensitive' } } },
        ];
    }

    const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
            user: true,
            shipping: true,
            shippingAddress: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return orders;
}

export async function getMyShipments() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
        throw new Error('Not authenticated');
    }
    const orders = await prisma.order.findMany({
        where: { userId, shipping: { isNot: null } },
        include: { shipping: true, shippingAddress: true },
        orderBy: { createdAt: 'desc' },
    });
    return orders as any;
}

export async function markShipmentReceived(orderId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) throw new Error('Not authenticated');

    const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { shipping: true } });
    if (!order) throw new Error('Order not found');
    if (!order.shipping) throw new Error('Shipping record not found');

    // Update shipping and order status
    await prisma.shipping.update({ where: { orderId }, data: { status: 'ENTREGADO' as any } });
    try { await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETADO' as any } }); } catch {}
    try { await prisma.auditLog.create({ data: { userId, action: 'CUSTOMER_CONFIRMED_DELIVERY', details: `order:${orderId}` } }); } catch {}

    try { const { revalidatePath } = await import('next/cache'); revalidatePath('/dashboard/cliente/envios', 'page' as any); } catch {}
    try { const { revalidatePath } = await import('next/cache'); revalidatePath('/dashboard/cliente/pedidos'); } catch {}
    try { const { revalidatePath } = await import('next/cache'); revalidatePath('/dashboard/admin/envios'); } catch {}
    return { ok: true };
}
