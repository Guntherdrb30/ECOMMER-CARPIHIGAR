'use client';

import { useEffect, useMemo, useState } from 'react';
import { STOCK_POLL_MS } from '@/lib/constants';
import { useCartStore } from '@/store/cart';
import type { Product } from '@prisma/client';
import { toast } from 'sonner';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
} from 'react-share';

export function ProductActions({ product }: { product: Omit<Product, 'priceUSD' | 'stockUnits'> & { priceUSD: number; stockUnits?: number | null } }) {
  const [quantity, setQuantity] = useState(1);
  const [liveStock, setLiveStock] = useState<number | null>(null);
  const stock = useMemo(() => {
    const base = typeof product.stockUnits === 'number' && product.stockUnits != null && !isNaN(product.stockUnits)
      ? product.stockUnits
      : product.stock;
    return liveStock ?? base;
  }, [liveStock, product.stock, product.stockUnits]);
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
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (stock <= 0) {
      toast.error('Producto agotado');
      return;
    }
    const safeQty = Math.max(1, Math.min(quantity, stock));
    addItem(
      {
        id: product.id,
        name: product.name,
        priceUSD: product.priceUSD,
        stock: stock,
        image: (product as any).images?.[0],
      },
      safeQty
    );
    if (safeQty < quantity) {
      toast.info(`Se agregó el máximo disponible (${safeQty})`);
    } else {
      toast.success('Producto agregado');
    }
  };

  const shareUrl = `${process.env.NEXTAUTH_URL}/productos/${product.slug}`;

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <label htmlFor="quantity" className="font-bold">Cantidad:</label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={Math.max(1, stock)}
          value={quantity}
          onChange={(e) => setQuantity(() => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return 1;
            return Math.max(1, Math.min(n, stock));
          })}
          className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
          disabled={stock === 0}
        />
        <span className="text-sm text-gray-500">{stock > 0 ? `Disponibles: ${stock}` : 'Agotado'}</span>
      </div>
      <button
        onClick={handleAddToCart}
        className="w-full bg-brand hover:bg-opacity-90 text-white font-bold text-lg py-3 px-8 rounded-full transition-colors disabled:bg-gray-400"
        disabled={stock === 0}
      >
        {stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
      </button>
      <div className="mt-8">
        <p className="text-center text-sm font-medium text-gray-600 mb-4">
          ¡Comparte este producto con tus amigos!
        </p>
        <div className="flex justify-center gap-4">
          <FacebookShareButton url={shareUrl} title={product.name}>
            <FacebookIcon size={42} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={product.name}>
            <TwitterIcon size={42} round />
          </TwitterShareButton>
          <WhatsappShareButton url={shareUrl} title={product.name} separator=":: ">
            <WhatsappIcon size={42} round />
          </WhatsappShareButton>
          <TelegramShareButton url={shareUrl} title={product.name}>
            <TelegramIcon size={42} round />
          </TelegramShareButton>
        </div>
      </div>
    </>
  );
}

