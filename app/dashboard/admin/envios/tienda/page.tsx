import prisma from "@/lib/prisma";
import { EnviosClient } from "../EnviosClient";

export default async function EnviosTiendaPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'asc' },
    where: { shipping: { channel: 'TIENDA' } },
    include: {
      user: { select: { name: true, email: true } },
      shipping: true,
    },
  });

  const typedOrders = orders.map(order => ({
    ...order,
    user: order.user ? order.user : { name: 'N/A', email: 'N/A' },
    shipping: order.shipping,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Envíos en Tienda</h1>
      <EnviosClient orders={typedOrders} />
    </div>
  );
}

