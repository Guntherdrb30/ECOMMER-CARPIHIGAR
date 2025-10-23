'use client';

import Link from 'next/link';
import Price from '@/components/price';
import type { Product } from '@prisma/client';
import WishlistButton from './wishlist-button';
import { useEffect, useMemo, useState } from 'react';

type ProductWithCategory = Product & {
    category: {
        name: string;
    } | null;
};

const ProductCard = ({ product, tasa, isWishlisted }: { product: ProductWithCategory, tasa: number, isWishlisted: boolean }) => {
  const [liveStock, setLiveStock] = useState<number | null>(null);
  const stock = useMemo(() => (liveStock ?? product.stock), [liveStock, product.stock]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/stock?ids=${encodeURIComponent(product.id)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const s = Number(data?.stocks?.[product.id] ?? NaN);
        if (!isNaN(s) && !cancelled) setLiveStock(s);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, [product.id]);

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
      <WishlistButton productId={product.id} isInitiallyWishlisted={isWishlisted} />
      <Link href={`/productos/${product.slug}`}>
        <div className="relative h-72 w-full overflow-hidden">
          <div
            style={{ backgroundImage: `url(${product.images[0] || 'https://via.placeholder.com/400'})` }}
            className={`bg-gray-200 h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105 ${stock <= 0 ? 'opacity-60' : ''}`}
          ></div>
          {stock <= 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
              Agotado
            </div>
          )}
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
};

export default ProductCard;
