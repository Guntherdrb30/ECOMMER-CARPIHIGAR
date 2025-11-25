import { getWishlistItems } from "@/server/actions/wishlist";
import ProductCard from "@/components/product-card";
import { getSettings } from "@/server/actions/settings";
import Link from 'next/link';

export default async function WishlistPage() {
  const [wishlistItems, settings] = await Promise.all([
    getWishlistItems(),
    getSettings(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis Favoritos</h1>
      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map(item => (
            <ProductCard 
              key={item.product.id} 
              product={item.product as any}
              tasa={settings.tasaVES}
              whatsappPhone={(settings as any).whatsappPhone}
              isWishlisted={true} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg shadow-sm">
          <p className="text-gray-600">Tu lista de favoritos está vacía.</p>
          <p className="text-gray-500 mt-2">Haz clic en el corazón de los productos que te gusten para guardarlos aquí.</p>
          <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Explorar productos
          </Link>
        </div>
      )}
    </div>
  );
}
