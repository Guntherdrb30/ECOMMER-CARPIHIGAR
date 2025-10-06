import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyOrders } from "@/server/actions/orders";
import { getWishlistItems } from "@/server/actions/wishlist";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { getSettings } from "@/server/actions/settings";
import { Order } from "@prisma/client";

const OrderRow = ({ order }: { order: Order & { payment: any } }) => (
  <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-semibold text-gray-800">Pedido #{order.id.substring(0, 8)}</p>
      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
    </div>
    <div className="text-right">
      <p className={`text-sm font-bold px-2 py-1 rounded-full text-white ${order.payment?.status === 'APROBADO' ? 'bg-green-500' : 'bg-yellow-500'}`}>{order.payment?.status || 'PENDIENTE'}</p>
    </div>
  </div>
);

export default async function ClienteDashboardPage() {
  const session = await getServerSession(authOptions);
  
  const [orders, wishlistItems, settings] = await Promise.all([
    getMyOrders({ take: 3 }),
    getWishlistItems({ take: 4 }),
    getSettings()
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Hola, {session?.user?.name?.split(' ')[0]}</h1>
      <p className="mt-1 text-gray-600">Bienvenido a tu panel. Aquí puedes ver un resumen de tu actividad.</p>

      <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">Pedidos Recientes</h2>
            <Link href="/dashboard/cliente/pedidos" className="text-sm font-medium text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map(order => <OrderRow key={order.id} order={order as any} />)
            ) : (
              <div className="bg-white p-6 rounded-lg text-center text-gray-500">
                <p>No has realizado ningún pedido todavía.</p>
              </div>
            )}
          </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Tus Favoritos</h2>
          <Link href="/dashboard/cliente/favoritos" className="text-sm font-medium text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map(item => (
              <ProductCard 
                key={item.product.id} 
                product={item.product as any} 
                tasa={settings.tasaVES.toNumber()} 
                isWishlisted={true} // All items from the wishlist are, by definition, wishlisted
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg text-center text-gray-500">
            <p>Aún no has añadido productos a tus favoritos.</p>
            <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">¡Explora la tienda!</Link>
          </div>
        )}
      </div>
    </div>
  );
}