import Link from 'next/link';
import Price from '@/components/price';
import type { Product } from '@prisma/client';
import WishlistButton from './wishlist-button';

type ProductWithCategory = Product & {
    category: {
        name: string;
    } | null;
};

const ProductCard = ({ product, tasa, isWishlisted }: { product: ProductWithCategory, tasa: number, isWishlisted: boolean }) => (
  <div className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
    <WishlistButton productId={product.id} isInitiallyWishlisted={isWishlisted} />
    <Link href={`/productos/${product.slug}`}>
      <div className="relative h-72 w-full overflow-hidden">
        <div 
          style={{ backgroundImage: `url(${product.images[0] || 'https://via.placeholder.com/400'})` }} 
          className="bg-gray-200 h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        ></div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
        <div className="mt-2">
          <Price priceUSD={product.priceUSD} tasa={tasa} moneda="USD" className="text-xl font-bold text-gray-900" />
          <Price priceUSD={product.priceUSD} tasa={tasa} moneda="VES" className="text-sm text-gray-600 block" />
        </div>
      </div>
    </Link>
  </div>
);

export default ProductCard;
