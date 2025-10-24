'use client';

import Link from 'next/link';
import Price from '@/components/price';
import type { Product } from '@prisma/client';
import WishlistButton from './wishlist-button';
import { useEffect, useMemo, useState } from 'react';
import { STOCK_POLL_MS } from '@/lib/constants';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

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
    const t = setInterval(poll, STOCK_POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [product.id]);

  const addItem = useCartStore((s) => s.addItem);

  const onAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0) { toast.error('Producto agotado'); return; }
    addItem({ id: product.id, name: product.name, priceUSD: product.priceUSD, stock, image: (product as any).images?.[0] }, 1);
    toast.success('Producto agregado al carrito');
  };

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
      </Link>
      <div className="p-4">
        <Link href={`/productos/${product.slug}`} className="block">
          <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
        </Link>
        <div className="mt-2">
          <Price priceUSD={product.priceUSD} tasa={tasa} moneda="USD" className="text-xl font-bold text-gray-900" />
          <Price priceUSD={product.priceUSD} tasa={tasa} moneda="VES" className="text-sm text-gray-600 block" />
        </div>
        <button
          onClick={onAddToCart}
          disabled={stock <= 0}
          className={`mt-3 w-full rounded-md py-2 text-sm font-semibold ${stock > 0 ? 'bg-brand text-white hover:bg-opacity-90' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
        >
          {stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
